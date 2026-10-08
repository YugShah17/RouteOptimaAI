# Database Schema & Entity Relationships

## 1. Overview

The persistence layer uses SQLAlchemy ORM, compatible with SQLite (default local development) and PostgreSQL (production).

## 2. Table Definitions

### `warehouses`
- `id` (PK, Integer)
- `name` (String 100)
- `address` (String 255)
- `latitude` (Float), `longitude` (Float)
- `created_at` (DateTime)

### `customers`
- `id` (PK, Integer)
- `name` (String 100)
- `phone` (String 50), `email` (String 100)
- `address` (String 255)
- `latitude` (Float), `longitude` (Float)
- `created_at` (DateTime)

### `orders`
- `id` (PK, Integer)
- `order_code` (String 50, Unique, Index)
- `customer_id` (FK -> `customers.id`, Nullable)
- `warehouse_id` (FK -> `warehouses.id`, Nullable)
- `customer_name` (String 100)
- `address` (String 255)
- `latitude` (Float), `longitude` (Float)
- `package_weight` (Float, kg)
- `priority` (String 20: LOW, NORMAL, HIGH, URGENT)
- `time_window_start` (Integer, minutes from 00:00)
- `time_window_end` (Integer, minutes from 00:00)
- `status` (String 30: PENDING, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, FAILED)
- `assigned_vehicle_id` (FK -> `vehicles.id`, Nullable)

### `vehicles`
- `id` (PK, Integer)
- `vehicle_number` (String 50, Unique, Index)
- `vehicle_type` (String 50)
- `max_capacity` (Float, kg)
- `current_load` (Float, kg)
- `current_latitude` (Float), `current_longitude` (Float)
- `status` (String 30: AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, OFFLINE)
- `assigned_route_id` (FK -> `routes.id`, Nullable)

### `routes`
- `id` (PK, Integer)
- `optimization_run_id` (FK -> `optimization_runs.id`)
- `vehicle_id` (FK -> `vehicles.id`)
- `total_distance_km` (Float)
- `estimated_duration_mins` (Float)
- `total_load_kg` (Float)
- `utilization_pct` (Float)
- `status` (String 30: DRAFT, APPROVED, IN_PROGRESS, COMPLETED)
- `polyline_geom` (Text, JSON coordinate array [[lat, lng], ...])

### `route_stops`
- `id` (PK, Integer)
- `route_id` (FK -> `routes.id`)
- `order_id` (FK -> `orders.id`, Nullable for depot)
- `stop_sequence` (Integer)
- `stop_type` (String 20: DEPOT_START, DELIVERY, DEPOT_END)
- `address` (String 255)
- `latitude` (Float), `longitude` (Float)
- `package_weight` (Float)
- `priority` (String 20)
- `eta_minutes` (Float)
- `time_window_start` (Integer), `time_window_end` (Integer)
- `is_late` (Boolean)
- `status` (String 30: PENDING, COMPLETED, FAILED)

### `optimization_runs`
- `id` (PK, Integer)
- `created_at` (DateTime)
- `status` (String 30)
- `problem_orders_count` (Integer), `problem_vehicles_count` (Integer)
- `complexity_score` (Float), `complexity_level` (String 20)
- `ml_recommended_strategy` (String 50), `final_strategy` (String 50)
- `strategy_reason` (Text)
- `total_distance_km` (Float), `distance_before_km` (Float), `distance_saved_km` (Float), `pct_improvement` (Float)
- `vehicles_used` (Integer), `late_orders_count` (Integer), `capacity_violations` (Integer)
- `runtime_seconds` (Float)

### `routing_cache`
- `id` (PK, Integer)
- `origin_lat`, `origin_lng`, `dest_lat`, `dest_lng` (Floats, Indexed)
- `distance_km` (Float), `duration_mins` (Float)
- `provider` (String 50)
- `polyline_json` (Text)
