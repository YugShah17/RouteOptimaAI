# REST & WebSocket API Documentation

FastAPI provides interactive Swagger documentation at `http://localhost:8000/docs`.

## 1. Core Endpoints

### System & Dashboard
- `GET /api/health` — Service health and current timestamp.
- `GET /api/dashboard/summary` — Aggregated operational statistics, order status breakdowns, fleet utilization, and recent optimization runs.

### Order Management
- `GET /api/orders` — List orders with filtering (`status`, `priority`, `search`, pagination `limit`, `offset`).
- `POST /api/orders` — Create a single delivery order (accepts `customer_name`, `address`, `area`, `pincode`, `package_weight_kg`, `priority`, `time_window_start`, `time_window_end`; coordinates are automatically resolved by backend).
- `GET /api/orders/template` — Download sample CSV template (`orders_sample_template.csv`) without coordinates.
- `GET /api/orders/export` — Download all orders in CSV format.
- `POST /api/orders/import` — Multipart CSV import with strict row-by-row validation, automatic geocoding, and failure breakdown.
- `GET /api/orders/{id}` — Retrieve order details.
- `PUT /api/orders/{id}` — Update order attributes.
- `POST /api/orders/{id}/retry-geocode` — Retry geocoding for unlocated order.
- `DELETE /api/orders/{id}` — Delete order.

### Fleet & Telemetry (API Key Secured)
- `GET /api/vehicles` — Retrieve fleet vehicles and current loads.
- `POST /api/vehicles` — Register a new vehicle.
- `GET /api/vehicles/{id}` — Retrieve vehicle details.
- `PUT /api/vehicles/{id}` — Update vehicle attributes.
- `POST /api/vehicles/{id}/location` — Ingest live GPS coordinates (`latitude`, `longitude`, `speed`). **Requires `X-API-Key` header or `?api_key=` parameter.** Broadcasts to all active WebSocket clients.

### Geocoding & Routing
- `POST /api/geocode` — Resolve address + area + pincode using Nominatim / OpenStreetMap and verified locality directory. Returns `{latitude, longitude, status, matched_area, error}`.
- `GET /api/routes` — Retrieve generated delivery routes with stop sequences and polyline geometries.
- `GET /api/routes/{id}` — Retrieve route detail.

### Optimization Suite
- `POST /api/optimization/analyze` — Extract 8 complexity features, predict strategy via Random Forest, verify feasibility.
- `POST /api/optimization/run` — Run selected optimization algorithm (GREEDY, LOCAL_SEARCH, GENETIC, or HYBRID), persist routes, and compute Before vs After comparison.
- `GET /api/optimization/runs` — Retrieve historical optimization audit logs.
- `GET /api/optimization/runs/{id}` — Retrieve run diagnostics.

### Simulation Controls & Telemetry Security
- `GET /api/simulation/api-key-info` — Retrieve telemetry API key configuration, expected header (`X-API-Key`), and integration curl examples.
- `POST /api/simulation/start?speed=1.0` — Start vehicle movement simulation along approved routes. **Requires `X-API-Key` header or `?api_key=`.**
- `POST /api/simulation/stop` — Pause or terminate simulation. **Requires `X-API-Key` header or `?api_key=`.**
- `GET /api/simulation/status` — Get simulation running state, speed factor, and security protection status.

### Machine Learning
- `GET /api/ml/metrics` — Retrieve trained Random Forest evaluation metrics (accuracy, F1, precision, recall, sample counts, feature importances).
- `GET /api/ml/model-info` — Model architecture and training metadata.

### Demo Controls
- `POST /api/demo/seed` — Seed realistic Pune logistics dataset (2 warehouses, 60 customers, 12 vehicles, 120 orders).
- `POST /api/demo/clear` — Clear test orders, routes, and optimizations.

---

## 2. Real-Time WebSocket Protocol

**Endpoint:** `ws://localhost:8000/ws/live`

### Event Types:
1. `vehicle_location`:
```json
{
  "type": "vehicle_location",
  "vehicle_id": 1,
  "vehicle_number": "MH-12-DEL-1001",
  "latitude": 18.5308,
  "longitude": 73.8475,
  "speed": 35.0,
  "current_stop_sequence": 1,
  "next_stop_sequence": 2,
  "next_stop_address": "Baner High Street, Pune",
  "eta_minutes": 14.5,
  "status": "IN_TRANSIT",
  "current_load": 45.0,
  "is_simulation": true
}
```

2. `order_status`:
```json
{
  "type": "order_status",
  "order_id": 42,
  "status": "DELIVERED"
}
```

3. `optimization_progress`:
```json
{
  "type": "optimization_progress",
  "run_id": 3,
  "progress": 65,
  "stage": "Running GENETIC Optimization..."
}
```

4. `optimization_completed`:
```json
{
  "type": "optimization_completed",
  "run_id": 3,
  "strategy": "GENETIC",
  "pct_improvement": 18.4,
  "distance_saved_km": 42.1
}
```
