import time
import copy
from typing import List, Dict, Any, Callable, Optional
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.genetic import GeneticOptimizer
from backend.app.optimization.local_search import LocalSearchOptimizer

class HybridOptimizer:
    """
    Hybrid Metaheuristic: Genetic Algorithm for global exploration
    followed by Local Search / 2-opt for local exploitation.
    """
    def __init__(self, evaluator: RouteEvaluator = None):
        self.evaluator = evaluator or RouteEvaluator()
        self.genetic = GeneticOptimizer(evaluator=self.evaluator)
        self.local_search = LocalSearchOptimizer(evaluator=self.evaluator)

    def solve(
        self,
        orders: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        dist_matrix: List[List[float]],
        time_matrix: List[List[float]],
        depot_idx: int = 0,
        max_time_seconds: float = 30.0,
        progress_callback: Optional[Callable[[int, float], None]] = None
    ) -> Dict[str, Any]:
        start_time = time.time()

        # Phase 1: Genetic Algorithm (80% time budget)
        ga_time_budget = max(5.0, max_time_seconds * 0.8)
        ga_result = self.genetic.solve(
            orders, vehicles, dist_matrix, time_matrix, depot_idx,
            max_time_seconds=ga_time_budget,
            progress_callback=progress_callback
        )

        # Phase 2: Local Search Refinement on GA's best routes
        remaining_time = max(2.0, max_time_seconds - (time.time() - start_time))
        ls_result = self.local_search.solve(
            orders, vehicles, dist_matrix, time_matrix, depot_idx,
            initial_routes=ga_result["routes"],
            max_time_seconds=remaining_time
        )

        total_runtime = round(time.time() - start_time, 4)

        return {
            "algorithm": "HYBRID",
            "routes": ls_result["routes"],
            "metrics": ls_result["metrics"],
            "runtime_seconds": total_runtime
        }
