import os
import time
import pandas as pd
from pathlib import Path
from backend.ml.dataset_generator import generate_scenario
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.greedy import GreedyOptimizer
from backend.app.optimization.local_search import LocalSearchOptimizer
from backend.app.optimization.genetic import GeneticOptimizer
from backend.app.optimization.hybrid import HybridOptimizer

def run_benchmark(output_path: str = "data/benchmark_results.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    evaluator = RouteEvaluator()
    greedy_solver = GreedyOptimizer(evaluator)
    ls_solver = LocalSearchOptimizer(evaluator)
    ga_solver = GeneticOptimizer(evaluator, population_size=40, generations=50)
    hybrid_solver = HybridOptimizer(evaluator)

    problem_sizes = [10, 20, 50, 80]
    records = []

    print("=" * 60)
    print("STARTING ALGORITHM BENCHMARK EXPERIMENTS")
    print("=" * 60)

    for size in problem_sizes:
        num_vehicles = max(2, int(size / 8))
        print(f"\n--- Benchmarking Problem Size: {size} Orders, {num_vehicles} Vehicles ---")

        depot, orders, vehicles, dist_matrix, time_matrix = generate_scenario(size, num_vehicles)

        algorithms = [
            ("GREEDY", lambda: greedy_solver.solve(orders, vehicles, dist_matrix, time_matrix, 0)),
            ("LOCAL_SEARCH", lambda: ls_solver.solve(orders, vehicles, dist_matrix, time_matrix, 0, max_time_seconds=10.0)),
            ("GENETIC", lambda: ga_solver.solve(orders, vehicles, dist_matrix, time_matrix, 0, max_time_seconds=15.0)),
            ("HYBRID", lambda: hybrid_solver.solve(orders, vehicles, dist_matrix, time_matrix, 0, max_time_seconds=20.0))
        ]

        for alg_name, solve_fn in algorithms:
            t0 = time.time()
            res = solve_fn()
            elapsed = round(time.time() - t0, 4)
            m = res["metrics"]

            records.append({
                "problem_size": size,
                "vehicles_available": num_vehicles,
                "algorithm": alg_name,
                "distance_km": m["total_distance"],
                "runtime_seconds": res.get("runtime_seconds", elapsed),
                "is_feasible": m["is_feasible"],
                "vehicles_used": m["vehicles_used"],
                "late_deliveries": m["total_late"],
                "total_cost": m["total_cost"]
            })

            print(f"  [{alg_name:<12}] Dist: {m['total_distance']:>7.2f} km | Runtime: {elapsed:>6.3f}s | Vehicles: {m['vehicles_used']} | Late: {m['total_late']}")

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print("\n" + "=" * 60)
    print(f"Benchmark results successfully saved to {output_path}")
    print("=" * 60)
    return df

if __name__ == "__main__":
    run_benchmark()
