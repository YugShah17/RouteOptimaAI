import math
from typing import List, Dict, Any, Tuple
from backend.app.schemas.schemas import ComplexityAnalysis
from backend.app.services.routing import haversine_distance_km

class ComplexityService:
    @staticmethod
    def analyze(
        orders: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        depot: Dict[str, Any]
    ) -> ComplexityAnalysis:
        num_orders = len(orders)
        num_vehicles = len(vehicles)

        if num_orders == 0:
            return ComplexityAnalysis(
                number_of_orders=0,
                number_of_vehicles=num_vehicles,
                total_capacity=sum(v.get("max_capacity", 100.0) for v in vehicles),
                total_package_weight=0.0,
                capacity_utilization=0.0,
                number_of_constraints=0,
                priority_ratio=0.0,
                time_window_ratio=0.0,
                geographical_spread_km=0.0,
                average_customer_distance_km=0.0,
                complexity_score=0.0,
                complexity_level="LOW"
            )

        total_cap = sum(v.get("max_capacity", 100.0) for v in vehicles)
        total_weight = sum(o.get("package_weight", 0.0) for o in orders)
        cap_util = round((total_weight / total_cap * 100.0) if total_cap > 0 else 100.0, 2)

        # High priority ratio
        high_prio_orders = sum(1 for o in orders if o.get("priority") in ("HIGH", "URGENT"))
        priority_ratio = round(high_prio_orders / num_orders, 3)

        # Tight time window ratio (< 180 minutes delivery window)
        tight_tw = 0
        for o in orders:
            tw_span = o.get("time_window_end", 1080) - o.get("time_window_start", 540)
            if tw_span <= 180:
                tight_tw += 1
        tw_ratio = round(tight_tw / num_orders, 3)

        # Locations spread
        all_locs = [(depot["latitude"], depot["longitude"])] + [
            (o["latitude"], o["longitude"]) for o in orders
        ]
        
        max_dist = 0.0
        total_dist = 0.0
        pair_count = 0

        for i in range(len(all_locs)):
            for j in range(i + 1, len(all_locs)):
                d = haversine_distance_km(all_locs[i][0], all_locs[i][1], all_locs[j][0], all_locs[j][1])
                if d > max_dist:
                    max_dist = d
                total_dist += d
                pair_count += 1

        avg_dist = round(total_dist / pair_count, 2) if pair_count > 0 else 0.0
        geo_spread = round(max_dist, 2)

        # Total constraints: capacity constraint + priority constraints + time window constraints
        num_constraints = num_vehicles + high_prio_orders + tight_tw

        # Normalized Complexity Score calculation (0 - 100)
        # Factor 1: Order volume scale (up to 40 pts) - scales logarithmically/linearly up to 100 orders
        score_orders = min(40.0, (num_orders / 80.0) * 40.0)

        # Factor 2: Vehicle fleet sizing ratio & tightness (up to 15 pts)
        score_capacity = min(15.0, (cap_util / 90.0) * 15.0)

        # Factor 3: Constraints complexity (up to 20 pts)
        score_constraints = min(20.0, (priority_ratio * 10.0) + (tw_ratio * 10.0))

        # Factor 4: Spatial dispersion (up to 25 pts)
        score_spatial = min(25.0, (avg_dist / 20.0) * 15.0 + (geo_spread / 40.0) * 10.0)

        raw_score = score_orders + score_capacity + score_constraints + score_spatial
        complexity_score = round(max(0.0, min(100.0, raw_score)), 1)

        if complexity_score < 40.0:
            level = "LOW"
        elif complexity_score < 70.0:
            level = "MEDIUM"
        else:
            level = "HIGH"

        return ComplexityAnalysis(
            number_of_orders=num_orders,
            number_of_vehicles=num_vehicles,
            total_capacity=round(total_cap, 2),
            total_package_weight=round(total_weight, 2),
            capacity_utilization=cap_util,
            number_of_constraints=num_constraints,
            priority_ratio=priority_ratio,
            time_window_ratio=tw_ratio,
            geographical_spread_km=geo_spread,
            average_customer_distance_km=avg_dist,
            complexity_score=complexity_score,
            complexity_level=level
        )

complexity_service = ComplexityService()
