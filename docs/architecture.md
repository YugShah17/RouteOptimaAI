# System Architecture

## 1. Overview

The **AI-Based Complexity-Aware Delivery Route Optimization System** is engineered as a modular monolith. It unifies order and vehicle management, problem feature extraction, scikit-learn machine learning classification, heuristic and metaheuristic multi-vehicle routing, live Leaflet map rendering, and asynchronous WebSocket telemetry simulation.

```
+-------------------------------------------------------------------------+
|                           React 19 Frontend                             |
|  - Dashboard KPIs & Charts        - Order Management & CSV Import       |
|  - Complexity & ML Inspection     - Interactive Multi-Vehicle Route Map |
|  - Live Vehicle GPS Simulation    - Historical Run Audit Logs           |
+-------------------------------------------------------------------------+
                                    |
                    REST APIs & WebSocket Stream
                                    v
+-------------------------------------------------------------------------+
|                           FastAPI Monolith                              |
|                                                                         |
|  +-------------------+  +---------------------+  +--------------------+ |
|  |  Complexity & ML  |  | Optimization Engine |  | Routing & Geocode  | |
|  |  - Feature Extr.  |  |  - Nearest Neighbor |  |  - OSRM Provider   | |
|  |  - Random Forest  |  |  - 2-Opt Loc. Search|  |  - Haversine Fall. | |
|  |  - Explainability |  |  - Genetic Alg (OX) |  |  - Distance Matrix | |
|  |  - Feasibility    |  |  - Hybrid GA + 2-Opt|  |  - DB Matrix Cache | |
|  +-------------------+  +---------------------+  +--------------------+ |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  | Real-Time Simulation Engine & WebSocket Connection Manager       |  |
|  +------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
                                    |
                              SQLAlchemy ORM
                                    v
+-------------------------------------------------------------------------+
|                  Database (SQLite Dev / PostgreSQL Prod)                |
|  warehouses, customers, orders, vehicles, routes, route_stops,          |
|  optimization_runs, optimization_metrics, routing_cache, model_versions |
+-------------------------------------------------------------------------+
```

## 2. Key Modules

### A. Problem Complexity & Machine Learning
- Analyzes problem scale, spatial density, geographical spread, vehicle fleet headroom, tight delivery time windows, and priority ratios.
- Evaluates instances against a trained Random Forest Classifier to dynamically predict whether Greedy, Local Search, or Genetic metaheuristics yield the superior cost-to-time trade-off.

### B. Algorithmic Optimization Suite
- Capacity-Constrained Vehicle Routing Problem with Time Windows (CVRPTW).
- Objective: Minimize total distance while penalizing delivery time window violations and capacity overruns.
- Algorithms: Nearest Neighbor, 2-Opt intra/inter-route relocation, Genetic Algorithm with Order Crossover (OX), and Hybrid GA + Local Search.

### C. Open Routing Engine & Spatial Fallback
- Connects to OpenStreetMap Nominatim for forward geocoding.
- Leverages OSRM for driving distance matrices and turn-by-turn road geometry.
- Automatically falls back to Haversine great-circle distance with road curvature multipliers (1.3x) if network or external services are unreachable.
- Caches all pairwise distance calculations in `routing_cache` table to prevent redundant network trips.

### D. Real-Time Telemetry & Simulation Mode
- Emulates fleet GPS telemetry using an event-driven background loop.
- Traverses routes segment by segment, reporting vehicle latitude/longitude, speed, current and upcoming stops, and completed deliveries via WebSockets (`/ws/live`).
