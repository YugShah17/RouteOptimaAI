import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
import pandas as pd
from backend.app.config import settings
from backend.app.schemas.schemas import ComplexityAnalysis, StrategyRecommendation

logger = logging.getLogger("ml_service")

class MLStrategyService:
    def __init__(self):
        self.model = None
        self.metrics = None
        self._load_model()

    def _load_model(self):
        try:
            if settings.ML_MODEL_PATH.exists():
                self.model = joblib.load(settings.ML_MODEL_PATH)
                logger.info(f"Loaded ML model from {settings.ML_MODEL_PATH}")
            if settings.ML_METRICS_PATH.exists():
                with open(settings.ML_METRICS_PATH, "r") as f:
                    self.metrics = json.load(f)
        except Exception as e:
            logger.error(f"Error loading ML model: {e}")

    def get_model_info(self) -> Dict[str, Any]:
        if not self.metrics and settings.ML_METRICS_PATH.exists():
            with open(settings.ML_METRICS_PATH, "r") as f:
                self.metrics = json.load(f)

        if self.metrics:
            return self.metrics

        return {
            "version_name": "RF-Complexity-v1.0 (Not yet trained)",
            "algorithm_name": "Random Forest Classifier",
            "accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "training_samples": 0,
            "test_samples": 0,
            "classes": ["GREEDY", "LOCAL_SEARCH", "GENETIC"],
            "feature_importance": {},
            "trained_at": None
        }

    def predict_strategy(self, complexity: ComplexityAnalysis) -> StrategyRecommendation:
        """
        Runs ML prediction on complexity features with safety rules and explanation.
        """
        feature_dict = {
            "number_of_orders": complexity.number_of_orders,
            "number_of_vehicles": complexity.number_of_vehicles,
            "number_of_constraints": complexity.number_of_constraints,
            "average_distance": complexity.average_customer_distance_km,
            "geographical_spread": complexity.geographical_spread_km,
            "priority_ratio": complexity.priority_ratio,
            "time_window_ratio": complexity.time_window_ratio,
            "capacity_utilization": complexity.capacity_utilization
        }

        # Ensure model is loaded
        if self.model is None and settings.ML_MODEL_PATH.exists():
            self._load_model()

        recommended = "GREEDY"
        confidence = 0.85
        feature_importance = self.metrics.get("feature_importance", {}) if self.metrics else {}

        if self.model is not None:
            try:
                feature_order = [
                    "number_of_orders",
                    "number_of_vehicles",
                    "number_of_constraints",
                    "average_distance",
                    "geographical_spread",
                    "priority_ratio",
                    "time_window_ratio",
                    "capacity_utilization"
                ]
                input_df = pd.DataFrame([[feature_dict[col] for col in feature_order]], columns=feature_order)
                pred_class = self.model.predict(input_df)[0]
                proba = self.model.predict_proba(input_df)[0]
                class_idx = list(self.model.classes_).index(pred_class)
                confidence = float(proba[class_idx])
                recommended = str(pred_class)
            except Exception as e:
                logger.warning(f"ML inference fallback: {e}")
                # Fallback heuristic rule
                if complexity.complexity_score < 40:
                    recommended = "GREEDY"
                elif complexity.complexity_score < 70:
                    recommended = "LOCAL_SEARCH"
                else:
                    recommended = "GENETIC"
        else:
            # Baseline rule if model not yet trained
            if complexity.complexity_score < 40:
                recommended = "GREEDY"
            elif complexity.complexity_score < 70:
                recommended = "LOCAL_SEARCH"
            else:
                recommended = "GENETIC"

        # Apply Safety & Feasibility Rules
        final_strategy = recommended
        safety_applied = False
        reasons = []

        if complexity.number_of_orders <= 6:
            if recommended != "GREEDY":
                safety_applied = True
                final_strategy = "GREEDY"
                reasons.append("Problem size is very small (<= 6 orders); heuristic Greedy suffices without metaheuristic overhead.")
            else:
                reasons.append(f"Small routing problem ({complexity.number_of_orders} orders) with low complexity score ({complexity.complexity_score}/100).")
        elif complexity.complexity_score >= 75 and complexity.number_of_orders >= 25:
            # High complexity recommendation upgrade to Hybrid
            final_strategy = "HYBRID"
            safety_applied = True
            reasons.append(f"High complexity score ({complexity.complexity_score}/100) with {complexity.number_of_orders} orders and multiple constraints; using Hybrid Genetic + Local Search for maximum route quality.")
        else:
            if recommended == "GENETIC":
                reasons.append(f"Significant order density ({complexity.number_of_orders} orders) and tight constraints require genetic population exploration.")
            elif recommended == "LOCAL_SEARCH":
                reasons.append(f"Moderate problem scale ({complexity.number_of_orders} orders) where 2-opt neighborhood search achieves rapid convergence.")
            else:
                reasons.append(f"Greedy nearest neighbor is favored for quick assignment with low route complexity.")

        reason_text = " ".join(reasons)

        return StrategyRecommendation(
            recommended_strategy=recommended,
            confidence=round(confidence, 3),
            reason=reason_text,
            safety_applied=safety_applied,
            final_strategy=final_strategy,
            feature_importance=feature_importance
        )

ml_strategy_service = MLStrategyService()
