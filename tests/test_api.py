import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_orders" in data
    assert "active_vehicles" in data

def test_get_orders():
    response = client.get("/api/orders?limit=10")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_vehicles():
    response = client.get("/api/vehicles")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_geocode_fallback():
    response = client.post("/api/geocode", json={"address": "Kothrud Depot, Pune"})
    assert response.status_code == 200
    data = response.json()
    assert "latitude" in data
    assert "longitude" in data

def test_simulation_api_key_required():
    # Without API key -> 401 Unauthorized
    resp = client.post("/api/simulation/start?speed=1.0")
    assert resp.status_code == 401

    # With invalid API key -> 401 Unauthorized
    resp_bad = client.post("/api/simulation/start?speed=1.0", headers={"X-API-Key": "wrong-key"})
    assert resp_bad.status_code == 401

    # With valid API key -> 200 OK
    resp_good = client.post("/api/simulation/start?speed=1.0", headers={"X-API-Key": "dev-telemetry-key-2026"})
    assert resp_good.status_code == 200

    # Stop with valid API key
    resp_stop = client.post("/api/simulation/stop", headers={"X-API-Key": "dev-telemetry-key-2026"})
    assert resp_stop.status_code == 200
