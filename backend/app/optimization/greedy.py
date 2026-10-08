import time
from typing import List, Dict, Any, Tuple
from backend.app.optimization.evaluator import RouteEvaluator

class GreedyOptimizer:
    """
    Capacity-constrained Nearest Neighbor Multi-Vehicle Routing Heuristic.
    Orders with higher priorities (URGENT, HIGH) are favored when distances are competitive.
    """
    def __init__(self, evaluator: RouteEvaluator = None):
        self.evaluator = evaluator or RouteEvaluator()

    def solve(
        self,
        orders: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        dist_matrix: List[List[float]],
        time_matrix: List[List[float]],
        depot_idx: int = 0
    ) -> Dict[str, Any]:
        start_time = time.time()
        num_orders = len(orders)
        num_vehicles = len(vehicles)

        if num_orders == 0 or num_vehicles == 0:
            return {
                "algorithm": "GREEDY",
                "routes": [[] for _ in range(num_vehicles)],
                "metrics": self.evaluator.evaluate_solution(
                    [[] for _ in range(num_vehicles)], orders, vehicles, dist_matrix, time_matrix, depot_idx
                ),
                "runtime_seconds": 0.0
            }

        # Priority weights: URGENT (4), HIGH (3), NORMAL (2), LOW (1)
        priority_multiplier = {
            "URGENT": 0.7,   # effectively reduces perceived distance to encourage visiting sooner
            "HIGH": 0.85,
            "NORMAL": 1.0,
            "LOW": 1.15
        }

        unvisited = set(range(num_orders))
        vehicle_routes: List[List[int]] = [[] for _ in range(num_vehicles)]

        for v_idx in range(num_vehicles):
            if not unvisited:
                break

            v_cap = vehicles[v_idx].get("max_capacity", 100.0)
            current_load = 0.0
            curr_loc_idx = depot_idx

            while unvisited:
                # Find feasible unvisited order with lowest effective distance
                best_o = None
                best_eff_dist = float("inf")

                for o_idx in unvisited:
                    weight = orders[o_idx].get("package_weight", 0.0)
                    if current_load + weight <= v_cap:
                        o_loc = orders[o_idx]["loc_idx"]
                        raw_dist = dist_matrix[curr_loc_idx][o_loc]
                        prio = orders[o_idx].get("priority", "NORMAL")
                        eff_dist = raw_dist * priority_multiplier.get(prio, 1.0)

                        if eff_dist < best_eff_dist:
                            best_eff_dist = eff_dist
                            best_o = o_idx

                if best_o is None:
                    # Vehicle capacity full, move to next vehicle
                    break

                # Add order to vehicle route
                vehicle_routes[v_idx].append(best_o)
                unvisited.remove(best_o)
                current_load += orders[best_o].get("package_weight", 0.0)
                curr_loc_idx = orders[best_o]["loc_idx"]

        # If any unvisited orders remain because fleet capacity was strictly filled,
        # assign them to the vehicle with minimum capacity overrun to ensure 0 lost orders
        if unvisited:
            for o_idx in sorted(unvisited, key=lambda i: orders[i].get("package_weight", 0.0)):
                # Assign to vehicle with smallest current load
                min_v = min(range(num_vehicles), key=lambda v: sum(orders[i].get("package_weight", 0.0) for i in vehicle_routes[v]))
                vehicle_routes[min_v].append(o_idx)

        runtime = round(time.time() - start_time, 4)
        solution_metrics = self.evaluator.evaluate_solution(
            vehicle_routes, orders, vehicles, dist_matrix, time_matrix, depot_idx
        )

        return {
            "algorithm": "GREEDY",
            "routes": vehicle_routes,
            "metrics": solution_metrics,
            "runtime_seconds": runtime
        }
