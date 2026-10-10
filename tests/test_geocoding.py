import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_geocode_endpoint_valid_pune_address():
    resp = client.post("/api/geocode", json={
        "address": "Baner High Street",
        "area": "Baner",
        "pincode": "411045"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert data["found"] is True
    assert data["latitude"] is not None
    assert data["longitude"] is not None
    assert 18.0 <= data["latitude"] <= 19.0
    assert 73.0 <= data["longitude"] <= 74.5

def test_geocode_endpoint_invalid_address():
    resp = client.post("/api/geocode", json={
        "address": "XyzNonExistentFakePlace123987",
        "area": "Nowhere",
        "pincode": "999999"  # invalid or unlocatable
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "FAILED"
    assert data["found"] is False
    assert data["latitude"] is None
    assert data["longitude"] is None
    assert "could not be located" in data["error"].lower()

def test_create_order_without_coordinates():
    # User creates order with only human-friendly address fields
    payload = {
        "customer_name": "Test Customer Baner",
        "address": "Baner Road near High Street",
        "area": "Baner",
        "pincode": "411045",
        "package_weight": 4.5,
        "priority": "HIGH",
        "time_window_start": 600,
        "time_window_end": 840
    }
    resp = client.post("/api/orders", json=payload)
    assert resp.status_code == 200
    order = resp.json()
    assert order["customer_name"] == "Test Customer Baner"
    assert order["area"] == "Baner"
    assert order["pincode"] == "411045"
    assert order["geocoding_status"] == "SUCCESS"
    assert order["latitude"] is not None
    assert order["longitude"] is not None
    assert 18.0 <= order["latitude"] <= 19.0

def test_create_order_with_unlocated_address():
    payload = {
        "customer_name": "Ghost Customer",
        "address": "Imaginary Floating Island 0000",
        "package_weight": 2.0,
        "priority": "LOW",
        "time_window_start": 540,
        "time_window_end": 1080
    }
    resp = client.post("/api/orders", json=payload)
    assert resp.status_code == 200
    order = resp.json()
    assert order["geocoding_status"] == "FAILED"
    assert order["latitude"] is None
    assert order["longitude"] is None
    assert order["geocoding_error"] is not None

    # Test retry geocode endpoint
    retry_resp = client.post(f"/api/orders/{order['id']}/retry-geocode")
    assert retry_resp.status_code == 200
    assert retry_resp.json()["geocoding_status"] == "FAILED"

def test_csv_import_without_coordinates():
    csv_data = (
        "order_id,customer_id,customer_name,address,area,pincode,package_weight_kg,priority,time_window_start,time_window_end,order_status\n"
        "ORD-TEST-1,C001,Test User 1,Baner Road,Baner,411045,3.0,HIGH,10:00,12:00,PENDING\n"
        "ORD-TEST-2,C002,Test User 2,Wakad Road,Wakad,411057,2.5,NORMAL,12:00,14:00,PENDING\n"
        "ORD-TEST-3,C003,Test User 3,Unlocatable Nowhere Island,Unknown,411099,1.5,LOW,14:00,16:00,PENDING\n"
    )
    file_bytes = io.BytesIO(csv_data.encode("utf-8"))
    resp = client.post("/api/orders/import", files={"file": ("test_orders.csv", file_bytes, "text/csv")})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_rows"] == 3
    assert data["valid_count"] == 3
    assert data["geocoded_count"] == 2
    assert data["geocoding_failed_count"] == 1
    assert len(data["failed_rows"]) == 1
    assert data["failed_rows"][0]["order_id"] == "ORD-TEST-3"

def test_template_download():
    resp = client.get("/api/orders/template")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    text = resp.text
    assert "order_id" in text
    assert "customer_name" in text
    assert "address" in text
    assert "area" in text
    assert "pincode" in text
    assert "package_weight_kg" in text
    assert "latitude" not in text
    assert "longitude" not in text
