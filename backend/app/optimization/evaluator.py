from typing import List, Dict, Any, Tuple

class RouteEvaluator:
    def __init__(
        self,
        distance_weight: float = 1.0,
        time_weight: float = 0.2,
        late_penalty: float = 50.0,
        capacity_penalty: float = 1000.0,
        service_time_mins: float = 5.0,
        depot_start_time_mins: float = 540.0  # 09:00 AM
    ):
        self.distance_weight = distance_weight
        self.time_weight = time_weight
        self.late_penalty = late_penalty
        self.capacity_penalty = capacity_penalty
        self.service_time_mins = service_time_mins
        self.depot_start_time_mins = depot_start_time_mins

    def evaluate_vehicle_route(
        self,
        route_indices: List[int],  # list of order indices (0 to N-1, where depot is separate index or 0)
        orders: List[Dict[str, Any]],
        dist_matrix: List[List[float]],
        time_matrix: List[List[float]],
        depot_idx: int,
        vehicle_capacity: float
    ) -> Dict[str, Any]:
        """
        Evaluates a single vehicle route:
        depot -> order[0] -> order[1] ... -> depot
        """
        if not route_indices:
            return {
                "distance": 0.0,
                "travel_time": 0.0,
                "total_time": 0.0,
                "total_weight": 0.0,
                "capacity_violation": 0.0,
                "late_count": 0,
                "cost": 0.0,
                "stop_details": []
            }

        total_distance = 0.0
        total_travel_time = 0.0
        current_time = self.depot_start_time_mins
        total_weight = 0.0
        late_count = 0
        stop_details = []

        curr_loc_idx = depot_idx

        # Initial depot stop
        stop_details.append({
            "stop_sequence": 1,
            "stop_type": "DEPOT_START",
            "order_id": None,
            "eta_minutes": current_time,
            "is_late": False,
            "weight": 0.0,
            "priority": "DEPOT"
        })

        # Process each order in the route
        for seq, o_idx in enumerate(route_indices, start=2):
            order = orders[o_idx]
            order_loc_idx = order["loc_idx"]
            
            # Leg from current location to order
            leg_dist = dist_matrix[curr_loc_idx][order_loc_idx]
            leg_time = time_matrix[curr_loc_idx][order_loc_idx]

            total_distance += leg_dist
            total_travel_time += leg_time
            current_time += leg_time

            # Check time window
            tw_start = order.get("time_window_start", 540)
            tw_end = order.get("time_window_end", 1080)
            
            # Wait if arrived before time window starts
            if current_time < tw_start:
                current_time = tw_start

            is_late = current_time > tw_end
            if is_late:
                late_count += 1

            # Service time
            current_time += self.service_time_mins

            total_weight += order.get("package_weight", 0.0)
            curr_loc_idx = order_loc_idx

            stop_details.append({
                "stop_sequence": seq,
                "stop_type": "DELIVERY",
                "order_id": order.get("id"),
                "order_code": order.get("order_code"),
                "eta_minutes": round(current_time - self.service_time_mins, 1),
                "is_late": is_late,
                "weight": order.get("package_weight", 0.0),
                "priority": order.get("priority", "NORMAL"),
                "address": order.get("address"),
                "latitude": order.get("latitude"),
                "longitude": order.get("longitude")
            })

        # Return to depot
        return_dist = dist_matrix[curr_loc_idx][depot_idx]
        return_time = time_matrix[curr_loc_idx][depot_idx]
        total_distance += return_dist
        total_travel_time += return_time
        current_time += return_time

        stop_details.append({
            "stop_sequence": len(stop_details) + 1,
            "stop_type": "DEPOT_END",
            "order_id": None,
            "eta_minutes": round(current_time, 1),
            "is_late": False,
            "weight": 0.0,
            "priority": "DEPOT"
        })

        # Capacity violation
        capacity_violation = max(0.0, total_weight - vehicle_capacity)

        # Weighted cost
        cost = (
            self.distance_weight * total_distance
            + self.time_weight * total_travel_time
            + self.late_penalty * late_count
            + self.capacity_penalty * capacity_violation
        )

        return {
            "distance": round(total_distance, 3),
            "travel_time": round(total_travel_time, 2),
            "total_time": round(current_time - self.depot_start_time_mins, 2),
            "total_weight": round(total_weight, 2),
            "capacity_violation": round(capacity_violation, 2),
            "late_count": late_count,
            "cost": round(cost, 2),
            "stop_details": stop_details
        }

    def evaluate_solution(
        self,
        routes: List[List[int]],  # routes[v] = list of order indices
        orders: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        dist_matrix: List[List[float]],
        time_matrix: List[List[float]],
        depot_idx: int
    ) -> Dict[str, Any]:
        """
        Evaluates full multi-vehicle solution.
        """
        total_distance = 0.0
        total_travel_time = 0.0
        total_cost = 0.0
        total_late = 0
        total_capacity_violations = 0.0
        route_evaluations = []
        vehicles_used = 0

        # Check coverage
        assigned_orders = set()
        for v_idx, route in enumerate(routes):
            if v_idx < len(vehicles):
                cap = vehicles[v_idx].get("max_capacity", 100.0)
            else:
                cap = 100.0

            evaluation = self.evaluate_vehicle_route(
                route, orders, dist_matrix, time_matrix, depot_idx, cap
            )
            route_evaluations.append(evaluation)

            if route:
                vehicles_used += 1
                total_distance += evaluation["distance"]
                total_travel_time += evaluation["travel_time"]
                total_cost += evaluation["cost"]
                total_late += evaluation["late_count"]
                total_capacity_violations += evaluation["capacity_violation"]
                for o_idx in route:
                    assigned_orders.add(o_idx)

        unassigned_count = len(orders) - len(assigned_orders)
        if unassigned_count > 0:
            total_cost += unassigned_count * 5000.0  # Heavy penalty for unassigned orders

        return {
            "total_distance": round(total_distance, 3),
            "total_travel_time": round(total_travel_time, 2),
            "total_cost": round(total_cost, 2),
            "total_late": total_late,
            "total_capacity_violations": round(total_capacity_violations, 2),
            "vehicles_used": vehicles_used,
            "unassigned_count": unassigned_count,
            "route_evaluations": route_evaluations,
            "is_feasible": (total_capacity_violations == 0 and unassigned_count == 0)
        }
