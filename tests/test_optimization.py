import pytest
from backend.app.optimization.evaluator import RouteEvaluator
from backend.app.optimization.greedy import GreedyOptimizer
from backend.app.optimization.local_search import LocalSearchOptimizer
from backend.app.optimization.genetic import GeneticOptimizer

@pytest.fixture
def sample_problem():
    orders = [
        {"id": 1, "order_code": "O1", "loc_idx": 1, "package_weight": 20.0, "priority": "NORMAL", "latitude": 18.52, "longitude": 73.85, "time_window_start": 540, "time_window_end": 720},
        {"id": 2, "order_code": "O2", "loc_idx": 2, "package_weight": 30.0, "priority": "HIGH", "latitude": 18.53, "longitude": 73.86, "time_window_start": 540, "time_window_end": 720},
        {"id": 3, "order_code": "O3", "loc_idx": 3, "package_weight": 25.0, "priority": "URGENT", "latitude": 18.51, "longitude": 73.84, "time_window_start": 600, "time_window_end": 840},
        {"id": 4, "order_code": "O4", "loc_idx": 4, "package_weight": 15.0, "priority": "LOW", "latitude": 18.54, "longitude": 73.87, "time_window_start": 540, "time_window_end": 1080},
    ]
    vehicles = [
        {"id": 1, "vehicle_number": "V1", "max_capacity": 60.0},
        {"id": 2, "vehicle_number": "V2", "max_capacity": 60.0}
    ]
    # 5x5 distance matrix (0 is depot)
    dist_matrix = [
        [0.0, 5.0, 6.0, 4.0, 8.0],
        [5.0, 0.0, 2.0, 7.0, 5.0],
        [6.0, 2.0, 0.0, 8.0, 4.0],
        [4.0, 7.0, 8.0, 0.0, 9.0],
        [8.0, 5.0, 4.0, 9.0, 0.0]
    ]
    time_matrix = [[d * 1.5 for d in row] for row in dist_matrix]
    return orders, vehicles, dist_matrix, time_matrix

def test_route_evaluator(sample_problem):
    orders, vehicles, dist_matrix, time_matrix = sample_problem
    evaluator = RouteEvaluator()
    # Route with order 1 and 2
    res = evaluator.evaluate_vehicle_route([0, 1], orders, dist_matrix, time_matrix, depot_idx=0, vehicle_capacity=60.0)
    assert res["distance"] > 0
    assert res["total_weight"] == 50.0
    assert res["capacity_violation"] == 0.0
    assert len(res["stop_details"]) == 4  # DEPOT_START, O1, O2, DEPOT_END

def test_greedy_optimizer(sample_problem):
    orders, vehicles, dist_matrix, time_matrix = sample_problem
    solver = GreedyOptimizer()
    res = solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx=0)
    assert res["metrics"]["is_feasible"] is True
    assert res["metrics"]["unassigned_count"] == 0
    # Check all orders visited exactly once
    visited = [idx for r in res["routes"] for idx in r]
    assert sorted(visited) == [0, 1, 2, 3]

def test_local_search_optimizer(sample_problem):
    orders, vehicles, dist_matrix, time_matrix = sample_problem
    solver = LocalSearchOptimizer()
    res = solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx=0)
    assert res["metrics"]["is_feasible"] is True
    assert res["metrics"]["total_distance"] > 0

def test_genetic_optimizer(sample_problem):
    orders, vehicles, dist_matrix, time_matrix = sample_problem
    solver = GeneticOptimizer(population_size=15, generations=10)
    res = solver.solve(orders, vehicles, dist_matrix, time_matrix, depot_idx=0)
    assert res["metrics"]["is_feasible"] is True
    assert res["metrics"]["unassigned_count"] == 0
