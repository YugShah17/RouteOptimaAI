import time
import copy
from typing import List, Dict, Any
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.greedy import GreedyOptimizer

class LocalSearchOptimizer:
    """
    Local Search Optimizer using 2-opt intra-route edge exchanges,
    intra-route single customer relocation, and inter-route relocations.
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
        capacity: float,
        deadline: float = float("inf")
    ) -> List[int]:
        """
        Performs 2-opt edge exchanges and intra-route relocation on a single vehicle route.
        Valid for any route with at least 2 stops.
        """
        if not route or len(route) < 2:
            return list(route) if route else []

        best_route = list(route)
        best_cost = self.evaluator.evaluate_vehicle_route(
            best_route, orders, dist_matrix, time_matrix, depot_idx, capacity
        )["cost"]

        improved = True
        iterations = 0
        limit = min(self.max_iterations, 100)

        while improved and iterations < limit:
            if time.time() > deadline:
                break

            improved = False
            iterations += 1
            n = len(best_route)

            # 1. 2-Opt segment inversion
            for i in range(n - 1):
                if time.time() > deadline:
                    break
                for j in range(i + 1, n):
                    # Reverse segment between i and j
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

            if improved:
                continue

            # 2. Intra-route order relocation (1-opt insertion)
            if n > 2:
                for from_idx in range(n):
                    if time.time() > deadline:
                        break
                    order_val = best_route[from_idx]
                    rem = best_route[:from_idx] + best_route[from_idx+1:]
                    for to_idx in range(n):
                        if to_idx == from_idx:
                            continue
                        candidate = rem[:to_idx] + [order_val] + rem[to_idx:]
                        cand_eval = self.evaluator.evaluate_vehicle_route(
                            candidate, orders, dist_matrix, time_matrix, depot_idx, capacity
                        )
                        if cand_eval["cost"] < best_cost - 1e-4:
                            best_route = candidate
                            best_cost = cand_eval["cost"]
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
        deadline = start_time + max(0.5, float(max_time_seconds))
        num_vehicles = len(vehicles)
        num_orders = len(orders)

        if num_orders == 0 or num_vehicles == 0:
            empty_routes = [[] for _ in range(num_vehicles)]
            return {
                "algorithm": "LOCAL_SEARCH",
                "routes": empty_routes,
                "metrics": self.evaluator.evaluate_solution(
                    empty_routes, orders, vehicles, dist_matrix, time_matrix, depot_idx
                ),
                "runtime_seconds": 0.0
            }

        # Get initial solution from greedy if not provided
        if initial_routes is None:
            greedy_solver = GreedyOptimizer(self.evaluator)
            greedy_res = greedy_solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx)
            current_routes = copy.deepcopy(greedy_res["routes"])
        else:
            current_routes = copy.deepcopy(initial_routes)

        # Ensure current_routes has exact slot count matching vehicles
        while len(current_routes) < num_vehicles:
            current_routes.append([])
        if len(current_routes) > num_vehicles:
            current_routes = current_routes[:num_vehicles]

        # 1. Intra-route 2-opt optimization
        for v_idx in range(num_vehicles):
            if time.time() > deadline:
                break
            if current_routes[v_idx]:
                v_cap = vehicles[v_idx].get("max_capacity", 100.0)
                current_routes[v_idx] = self.two_opt_route(
                    current_routes[v_idx], orders, dist_matrix, time_matrix, depot_idx, v_cap, deadline=deadline
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
            if time.time() > deadline:
                break

            improved = False
            iteration += 1

            for v1 in range(num_vehicles):
                if time.time() > deadline:
                    break
                if not best_routes[v1]:
                    continue

                v1_cap = vehicles[v1].get("max_capacity", 100.0)
                v1_old_eval = self.evaluator.evaluate_vehicle_route(
                    best_routes[v1], orders, dist_matrix, time_matrix, depot_idx, v1_cap
                )
                v1_old_cost = v1_old_eval["cost"]

                for v2 in range(num_vehicles):
                    if v1 == v2:
                        continue
                    if time.time() > deadline:
                        break

                    v2_cap = vehicles[v2].get("max_capacity", 100.0)
                    v2_old_eval = self.evaluator.evaluate_vehicle_route(
                        best_routes[v2], orders, dist_matrix, time_matrix, depot_idx, v2_cap
                    )
                    v2_old_cost = v2_old_eval["cost"]

                    curr_v2_load = sum(orders[i].get("package_weight", 0.0) for i in best_routes[v2])

                    for pos1, order_idx in enumerate(best_routes[v1]):
                        if time.time() > deadline:
                            break
                        order_weight = orders[order_idx].get("package_weight", 0.0)

                        if curr_v2_load + order_weight <= v2_cap:
                            trial_v1 = best_routes[v1][:pos1] + best_routes[v1][pos1+1:]
                            trial_v1_eval = self.evaluator.evaluate_vehicle_route(
                                trial_v1, orders, dist_matrix, time_matrix, depot_idx, v1_cap
                            )

                            # Try inserting into each position in v2
                            for pos2 in range(len(best_routes[v2]) + 1):
                                trial_v2 = best_routes[v2][:pos2] + [order_idx] + best_routes[v2][pos2:]
                                trial_v2_eval = self.evaluator.evaluate_vehicle_route(
                                    trial_v2, orders, dist_matrix, time_matrix, depot_idx, v2_cap
                                )

                                cost_delta = (trial_v1_eval["cost"] + trial_v2_eval["cost"]) - (v1_old_cost + v2_old_cost)
                                if cost_delta < -1e-4:
                                    best_routes[v1] = trial_v1
                                    best_routes[v2] = trial_v2
                                    best_cost += cost_delta
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
            if time.time() > deadline:
                break
            if best_routes[v_idx]:
                v_cap = vehicles[v_idx].get("max_capacity", 100.0)
                best_routes[v_idx] = self.two_opt_route(
                    best_routes[v_idx], orders, dist_matrix, time_matrix, depot_idx, v_cap, deadline=deadline
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
