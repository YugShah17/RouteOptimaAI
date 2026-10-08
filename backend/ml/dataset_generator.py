import os
import random
import time
import pandas as pd
import numpy as np
from pathlib import Path
from backend.app.services.routing import haversine_distance_km
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.greedy import GreedyOptimizer
from backend.app.optimization.local_search import LocalSearchOptimizer
from backend.app.optimization.genetic import GeneticOptimizer

# City bounds: Pune, Maharashtra
PUNE_CENTER = (18.5204, 73.8567)
LAT_SPREAD = 0.15  # ~15km
LON_SPREAD = 0.15

def generate_scenario(num_orders: int, num_vehicles: int):
    depot = {
        "id": 0,
        "name": "Central Depot",
        "latitude": PUNE_CENTER[0],
        "longitude": PUNE_CENTER[1]
    }

    orders = []
    for i in range(num_orders):
        lat = PUNE_CENTER[0] + random.uniform(-LAT_SPREAD, LAT_SPREAD)
        lon = PUNE_CENTER[1] + random.uniform(-LON_SPREAD, LON_SPREAD)
        weight = round(random.uniform(2.0, 25.0), 1)
        priority = random.choice(["LOW", "NORMAL", "NORMAL", "HIGH", "URGENT"])
        
        # Time window
        tw_start = random.choice([540, 600, 660, 720])
        tw_duration = random.choice([120, 180, 240, 360])
        tw_end = tw_start + tw_duration

        orders.append({
            "id": i + 1,
            "order_code": f"ORD-{i+1:04d}",
            "loc_idx": i + 1,
            "latitude": lat,
            "longitude": lon,
            "package_weight": weight,
            "priority": priority,
            "time_window_start": tw_start,
            "time_window_end": tw_end,
            "address": f"Customer Location {i+1}"
        })

    total_weight = sum(o["package_weight"] for o in orders)
    avg_cap_needed = total_weight / num_vehicles if num_vehicles > 0 else 100.0
    
    vehicles = []
    for v in range(num_vehicles):
        # Slightly surplus capacity so problems are usually feasible
        cap = round(avg_cap_needed * random.uniform(1.2, 1.6), 1)
        vehicles.append({
            "id": v + 1,
            "vehicle_number": f"MH12-V{v+1:03d}",
            "max_capacity": max(50.0, cap)
        })

    # Build locations matrix
    locations = [(depot["latitude"], depot["longitude"])] + [(o["latitude"], o["longitude"]) for o in orders]
    n = len(locations)
    dist_matrix = [[0.0] * n for _ in range(n)]
    time_matrix = [[0.0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i != j:
                d = haversine_distance_km(locations[i][0], locations[i][1], locations[j][0], locations[j][1]) * 1.3
                dist_matrix[i][j] = round(d, 3)
                time_matrix[i][j] = round((d / 35.0) * 60, 2)

    return depot, orders, vehicles, dist_matrix, time_matrix

def determine_best_strategy(greedy_metrics, ls_metrics, ga_metrics, num_orders):
    g_dist = greedy_metrics["metrics"]["total_distance"]
    g_time = greedy_metrics["runtime_seconds"]
    
    ls_dist = ls_metrics["metrics"]["total_distance"]
    ls_time = ls_metrics["runtime_seconds"]
    
    ga_dist = ga_metrics["metrics"]["total_distance"]
    ga_time = ga_metrics["runtime_seconds"]

    # If small order problem and greedy is within 3% of LS, Greedy is fast & sufficient
    if num_orders <= 10:
        if ls_dist >= g_dist * 0.96:
            return "GREEDY"
        else:
            return "LOCAL_SEARCH"

    # For medium problems (11 - 25 orders)
    if num_orders <= 25:
        # Check if Local Search improves distance significantly over Greedy
        if ls_dist < g_dist * 0.95 and ls_time < 2.0:
            return "LOCAL_SEARCH"
        elif ga_dist < ls_dist * 0.92:
            return "GENETIC"
        else:
            return "LOCAL_SEARCH"

    # For larger, more complex problems (> 25 orders)
    # Compare Genetic distance improvement vs Local Search
    if ga_dist < ls_dist * 0.96 or (ga_dist < g_dist * 0.88 and ga_time < 5.0):
        return "GENETIC"
    else:
        return "LOCAL_SEARCH"

def generate_dataset(num_samples: int = 600, output_path: str = "data/training_data.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    evaluator = RouteEvaluator()
    greedy_solver = GreedyOptimizer(evaluator)
    ls_solver = LocalSearchOptimizer(evaluator, max_iterations=60)
    ga_solver = GeneticOptimizer(evaluator, population_size=30, generations=35)

    records = []
    print(f"Generating {num_samples} simulated routing scenarios and running candidate algorithms...")

    for idx in range(num_samples):
        # Sample realistic problem sizes
        if idx % 3 == 0:
            num_orders = random.randint(5, 12)
            num_vehicles = random.randint(1, 3)
        elif idx % 3 == 1:
            num_orders = random.randint(13, 26)
            num_vehicles = random.randint(2, 5)
        else:
            num_orders = random.randint(27, 50)
            num_vehicles = random.randint(3, 7)

        depot, orders, vehicles, dist_matrix, time_matrix = generate_scenario(num_orders, num_vehicles)

        # Feature calculation
        total_capacity = sum(v["max_capacity"] for v in vehicles)
        total_weight = sum(o["package_weight"] for o in orders)
        cap_util = round((total_weight / total_capacity * 100.0), 2)
        high_prio = sum(1 for o in orders if o["priority"] in ("HIGH", "URGENT"))
        prio_ratio = round(high_prio / num_orders, 3)
        
        tight_tw = sum(1 for o in orders if (o["time_window_end"] - o["time_window_start"]) <= 180)
        tw_ratio = round(tight_tw / num_orders, 3)
        num_constraints = num_vehicles + high_prio + tight_tw

        # Spatial features
        all_dists = [dist_matrix[i][j] for i in range(len(dist_matrix)) for j in range(i+1, len(dist_matrix))]
        avg_dist = round(float(np.mean(all_dists)), 2) if all_dists else 0.0
        geo_spread = round(float(np.max(all_dists)), 2) if all_dists else 0.0

        # Run Candidate 1: Greedy
        g_res = greedy_solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx=0)

        # Run Candidate 2: Local Search
        ls_res = ls_solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx=0, initial_routes=g_res["routes"], max_time_seconds=3.0)

        # Run Candidate 3: Genetic Algorithm
        ga_res = ga_solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx=0, max_time_seconds=4.0)

        best_strat = determine_best_strategy(g_res, ls_res, ga_res, num_orders)

        records.append({
            "number_of_orders": num_orders,
            "number_of_vehicles": num_vehicles,
            "number_of_constraints": num_constraints,
            "average_distance": avg_dist,
            "geographical_spread": geo_spread,
            "priority_ratio": prio_ratio,
            "time_window_ratio": tw_ratio,
            "capacity_utilization": cap_util,
            "greedy_distance": g_res["metrics"]["total_distance"],
            "greedy_runtime": g_res["runtime_seconds"],
            "local_search_distance": ls_res["metrics"]["total_distance"],
            "local_search_runtime": ls_res["runtime_seconds"],
            "genetic_distance": ga_res["metrics"]["total_distance"],
            "genetic_runtime": ga_res["runtime_seconds"],
            "best_strategy": best_strat
        })

        if (idx + 1) % 100 == 0 or idx == num_samples - 1:
            print(f"Generated {idx + 1}/{num_samples} scenarios.")

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Saved dataset with {len(df)} rows to {output_path}")
    print("Class distribution:")
    print(df["best_strategy"].value_counts())
    return df

if __name__ == "__main__":
    generate_dataset()
