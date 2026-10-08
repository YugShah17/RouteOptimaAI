import time
import copy
from typing import List, Dict, Any
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.greedy import GreedyOptimizer

class LocalSearchOptimizer:
    """
    Local Search Optimizer using 2-opt intra-route edge exchanges
    and inter-route customer relocations.
    """
    def __init__(self, evaluator: RouteEvaluator = None, max_iterations: int = 150):
        self.evaluator = evaluator or RouteEvaluator()
        self.max_iterations = max_iterations

    def two_opt_route(
        self,
        route: List[int],
        orders: List[Dict[str, Any]],
        dist_matrix: List[List[float]],
        time_matrix: List[List[float]],
        depot_idx: int,
        capacity: float
    ) -> List[int]:
        """Performs 2-opt on a single vehicle route."""
        if len(route) < 3:
            return route

        best_route = list(route)
        best_cost = self.evaluator.evaluate_vehicle_route(
            best_route, orders, dist_matrix, time_matrix, depot_idx, capacity
        )["cost"]

        improved = True
        iterations = 0

        while improved and iterations < 50:
            improved = False
            iterations += 1
            n = len(best_route)

            for i in range(n - 1):
                for j in range(i + 1, n):
                    # 2-opt inversion: reverse segment between i and j
                    new_route = best_route[:i] + best_route[i:j+1][::-1] + best_route[j+1:]
                    new_eval = self.evaluator.evaluate_vehicle_route(
                        new_route, orders, dist_matrix, time_matrix, depot_idx, capacity
                    )
                    if new_eval["cost"] < best_cost - 1e-4:
                        best_route = new_route
                        best_cost = new_eval["cost"]
                        improved = True
                        break
                if improved:
                    break

        return best_route

    def solve(
        self,
        orders: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        dist_matrix: List[List[float]],
        time_matrix: List[List[float]],
        depot_idx: int = 0,
        initial_routes: List[List[int]] = None,
        max_time_seconds: float = 30.0
    ) -> Dict[str, Any]:
        start_time = time.time()
        num_vehicles = len(vehicles)

        # Get initial solution from greedy if not provided
        if initial_routes is None:
            greedy_solver = GreedyOptimizer(self.evaluator)
            greedy_res = greedy_solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx)
            current_routes = copy.deepcopy(greedy_res["routes"])
        else:
            current_routes = copy.deepcopy(initial_routes)

        # 1. Intra-route 2-opt optimization
        for v_idx in range(num_vehicles):
            if v_idx < len(current_routes) and current_routes[v_idx]:
                v_cap = vehicles[v_idx].get("max_capacity", 100.0)
                current_routes[v_idx] = self.two_opt_route(
                    current_routes[v_idx], orders, dist_matrix, time_matrix, depot_idx, v_cap
                )

        current_solution_eval = self.evaluator.evaluate_solution(
            current_routes, orders, vehicles, dist_matrix, time_matrix, depot_idx
        )
        best_cost = current_solution_eval["total_cost"]
        best_routes = copy.deepcopy(current_routes)

        # 2. Inter-route relocation (Shift an order from vehicle v1 to vehicle v2 if cost improves)
        iteration = 0
        improved = True

        while improved and iteration < self.max_iterations:
            if time.time() - start_time > max_time_seconds:
                break

            improved = False
            iteration += 1

            for v1 in range(num_vehicles):
                if not best_routes[v1]:
                    continue

                for v2 in range(num_vehicles):
                    if v1 == v2:
                        continue

                    v2_cap = vehicles[v2].get("max_capacity", 100.0)

                    for pos1, order_idx in enumerate(best_routes[v1]):
                        order_weight = orders[order_idx].get("package_weight", 0.0)
                        curr_v2_load = sum(orders[i].get("package_weight", 0.0) for i in best_routes[v2])

                        if curr_v2_load + order_weight <= v2_cap:
                            # Try inserting into each position in v2
                            for pos2 in range(len(best_routes[v2]) + 1):
                                trial_routes = copy.deepcopy(best_routes)
                                trial_routes[v1].pop(pos1)
                                trial_routes[v2].insert(pos2, order_idx)

                                trial_eval = self.evaluator.evaluate_solution(
                                    trial_routes, orders, vehicles, dist_matrix, time_matrix, depot_idx
                                )

                                if trial_eval["total_cost"] < best_cost - 1e-4:
                                    best_routes = trial_routes
                                    best_cost = trial_eval["total_cost"]
                                    improved = True
                                    break
                            if improved:
                                break
                    if improved:
                        break
                if improved:
                    break

        # Final 2-opt pass on all modified routes
        for v_idx in range(num_vehicles):
            if v_idx < len(best_routes) and best_routes[v_idx]:
                v_cap = vehicles[v_idx].get("max_capacity", 100.0)
                best_routes[v_idx] = self.two_opt_route(
                    best_routes[v_idx], orders, dist_matrix, time_matrix, depot_idx, v_cap
                )

        final_metrics = self.evaluator.evaluate_solution(
            best_routes, orders, vehicles, dist_matrix, time_matrix, depot_idx
        )
        runtime = round(time.time() - start_time, 4)

        return {
            "algorithm": "LOCAL_SEARCH",
            "routes": best_routes,
            "metrics": final_metrics,
            "runtime_seconds": runtime
        }
