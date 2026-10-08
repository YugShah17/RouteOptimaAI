import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from backend.ml.dataset_generator import generate_dataset

DATA_PATH = Path("data/training_data.csv")
MODEL_DIR = Path("backend/ml")
MODEL_FILE = MODEL_DIR / "model.joblib"
METRICS_FILE = MODEL_DIR / "metrics.json"

FEATURE_COLUMNS = [
    "number_of_orders",
    "number_of_vehicles",
    "number_of_constraints",
    "average_distance",
    "geographical_spread",
    "priority_ratio",
    "time_window_ratio",
    "capacity_utilization"
]

def train_model():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    if not DATA_PATH.exists():
        print(f"Data file {DATA_PATH} not found. Generating simulated dataset first...")
        df = generate_dataset(num_samples=500, output_path=str(DATA_PATH))
    else:
        df = pd.read_csv(DATA_PATH)

    print(f"Loaded dataset with {len(df)} samples.")
    print("Class distribution:")
    print(df["best_strategy"].value_counts())

    X = df[FEATURE_COLUMNS]
    y = df["best_strategy"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=10,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    importances = dict(zip(FEATURE_COLUMNS, [float(x) for x in clf.feature_importances_]))
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    print("\nModel Evaluation:")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))
    print("\nFeature Importances:")
    for feat, imp in sorted_importances.items():
        print(f"  {feat:<25}: {imp:.4f}")

    # Save model
    joblib.dump(clf, MODEL_FILE)
    print(f"\nSaved model to {MODEL_FILE}")

    # Save metrics JSON
    metrics = {
        "version_name": "RF-Complexity-v1.0",
        "algorithm_name": "Random Forest Classifier",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": [str(c) for c in clf.classes_],
        "feature_importance": {k: round(v, 4) for k, v in sorted_importances.items()},
        "trained_at": datetime.utcnow().isoformat()
    }

    with open(METRICS_FILE, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to {METRICS_FILE}")

    # Optionally persist in database
    try:
        from backend.app.database import SessionLocal
        from backend.app.models.entities import ModelVersion
        db = SessionLocal()
        # Mark existing active versions as inactive
        db.query(ModelVersion).filter(ModelVersion.is_active == True).update({"is_active": False})
        mv = ModelVersion(
            version_name="RF-Complexity-v1.0",
            algorithm_name="Random Forest Classifier",
            accuracy=round(acc, 4),
            precision=round(prec, 4),
            recall=round(rec, 4),
            f1_score=round(f1, 4),
            training_samples=len(X_train),
            test_samples=len(X_test),
            feature_importance_json=json.dumps(metrics["feature_importance"]),
            trained_at=datetime.utcnow(),
            is_active=True
        )
        db.add(mv)
        db.commit()
        db.close()
        print("Model version registered in database.")
    except Exception as e:
        print(f"Note: Could not register model version in DB yet (will register during seed): {e}")

    return metrics

if __name__ == "__main__":
    train_model()
