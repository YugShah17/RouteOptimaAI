import pytest
from backend.app.services.complexity import complexity_service

def test_complexity_analysis_low():
    orders = [
        {"id": 1, "package_weight": 5.0, "priority": "NORMAL", "latitude": 18.52, "longitude": 73.85, "time_window_start": 540, "time_window_end": 1080},
        {"id": 2, "package_weight": 8.0, "priority": "LOW", "latitude": 18.53, "longitude": 73.86, "time_window_start": 540, "time_window_end": 1080}
    ]
    vehicles = [{"id": 1, "max_capacity": 100.0}]
    depot = {"latitude": 18.5204, "longitude": 73.8567}

    res = complexity_service.analyze(orders, vehicles, depot)
    assert res.number_of_orders == 2
    assert res.complexity_score < 40.0
    assert res.complexity_level == "LOW"

def test_complexity_analysis_empty():
    res = complexity_service.analyze([], [], {"latitude": 18.52, "longitude": 73.85})
    assert res.number_of_orders == 0
    assert res.complexity_score == 0.0
    assert res.complexity_level == "LOW"
