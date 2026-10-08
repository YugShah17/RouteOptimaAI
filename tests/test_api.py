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
