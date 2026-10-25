# RouteOptimaAI — Codebase File Architecture & Directory Structure

> **Project:** AI-Based Complexity-Aware Delivery Route Optimization System  
> **Document:** Complete Codebase File Architecture & Module Reference Guide  
> **Last Updated:** October 2026

---

## 1. High-Level Directory Overview

The RouteOptimaAI codebase is organized as a clean **Modular Monolith** with clear separation of concerns across the frontend UI, backend REST & WebSocket API, algorithmic optimization engine, machine learning pipeline, relational persistence, and automated test suite:

```
RouteOptimaAI/
├── backend/                  # Python FastAPI Backend, ML Pipeline, & Optimization Engine
│   ├── app/                  # Application Core (API routes, services, models, schemas)
│   │   ├── api/              # REST API route controllers
│   │   ├── models/           # SQLAlchemy ORM entity definitions
│   │   ├── optimization/     # DAA solvers (Greedy, Local Search, GA, Hybrid, Evaluator)
│   │   ├── schemas/          # Pydantic V2 data validation & serialization schemas
│   │   ├── services/         # Business logic (complexity, geocoding, ML, routing, simulation)
│   │   ├── config.py         # Global settings & environment configuration
│   │   ├── database.py       # SQLAlchemy engine, session maker, & migration runners
│   │   └── main.py           # FastAPI entrypoint, middleware, & WebSocket lifecycle
│   ├── experiments/          # Benchmarking scripts comparing algorithm performance
│   ├── ml/                   # Machine learning dataset generator, training script, & model
│   ├── requirements.txt      # Python backend package dependencies
│   └── seed.py               # Database seeding utility for demo data
│
├── frontend/                 # React 19 Single Page Application (SPA)
│   ├── public/               # Static assets & SVG icons
│   ├── src/                  # Source code (pages, components, styles, services)
│   │   ├── assets/           # Application images & icons
│   │   ├── components/       # Reusable UI components (DeliveryMap Leaflet component)
│   │   ├── pages/            # View pages (Dashboard, Orders, Optimization, Tracking, etc.)
│   │   ├── services/         # API fetch client & WebSocket stream manager (api.js)
│   │   ├── App.css           # Layout & navigation bar styles
│   │   ├── App.jsx           # Root UI component with tab navigation & WebSocket receiver
│   │   ├── index.css         # Design system tokens, dark theme colors, & global utilities
│   │   └── main.jsx          # React DOM entrypoint
│   ├── package.json          # Node.js dependencies (React 19, Leaflet, Lucide)
│   └── vite.config.js        # Vite build & development server configuration
│
├── data/                     # CSV datasets (training instances, sample orders, benchmarks)
├── docs/                     # Technical architecture documentation, guides, and diagrams
├── tests/                    # Pytest test suite (API, algorithms, geocoding, complexity)
├── delivery.db               # SQLite development database file
└── README.md                 # Project README with setup and feature summary
```

---

## 2. Complete File-by-File Breakdown

### A. Root Directory Configuration & Metadata

| File Path | Primary Responsibility | Key Details |
|---|---|---|
| [`.env`](file:///c:/Yug%20Shah/DAAA/.env) | Local environment variables | Database URL, OSRM URL, Nominatim URL, Simulation API key, CORS origins. |
| [`.env.example`](file:///c:/Yug%20Shah/DAAA/.env.example) | Template environment file | Documents required configuration variables with production-ready defaults. |
| [`.gitignore`](file:///c:/Yug%20Shah/DAAA/.gitignore) | Git ignore specification | Excludes Python cache (`__pycache__`), virtual environments, `node_modules`, dist, and logs. |
| [`delivery.db`](file:///c:/Yug%20Shah/DAAA/delivery.db) | Local SQLite Database | Development database storing orders, vehicles, routes, runs, and routing cache. |
| [`README.md`](file:///c:/Yug%20Shah/DAAA/README.md) | Project Overview | High-level introduction, key features, architecture overview, and quick-start guide. |
| [`PROJECT_GUIDE.md`](file:///c:/Yug%20Shah/DAAA/PROJECT_GUIDE.md) | Developer Setup Guide | Step-by-step developer setup instructions, port configurations, and run commands. |
| [`PROJECT_DOCUMENTATION.md`](file:///c:/Yug%20Shah/DAAA/PROJECT_DOCUMENTATION.md) | Comprehensive Manual | Exhaustive project report covering academic methodology, algorithms, and results. |
| [`PROJECT_DOCUMENTATION.pdf`](file:///c:/Yug%20Shah/DAAA/PROJECT_DOCUMENTATION.pdf) | Compiled PDF Report | Formatted PDF document of project documentation for academic submission. |

---

### B. Backend Application Core (`backend/app/`)

#### 1. Core Runtime & Infrastructure

| File Path | Description | Key Exports / Functions |
|---|---|---|
| [`backend/app/main.py`](file:///c:/Yug%20Shah/DAAA/backend/app/main.py) | **FastAPI Application Entrypoint**<br/>Initializes FastAPI app, manages application lifespan (startup migrations, shutdown cleanup), mounts CORS middleware, registers API routes, and exposes the live WebSocket telemetry stream `/ws/live`. | `app`, `lifespan()`, `websocket_live_endpoint()` |
| [`backend/app/config.py`](file:///c:/Yug%20Shah/DAAA/backend/app/config.py) | **Global Application Settings**<br/>Loads `.env` configuration via `python-dotenv`. Defines database URIs, external routing URLs, genetic algorithm hyperparameters, simulation speed multipliers, and file paths. | `settings` (Instance of `Settings`) |
| [`backend/app/database.py`](file:///c:/Yug%20Shah/DAAA/backend/app/database.py) | **Database Engine & Migration Manager**<br/>Creates SQLAlchemy `engine` and `SessionLocal`. Provides `get_db()` dependency for FastAPI routes. Contains `run_migrations()` which safely upgrades SQLite table schemas (adding area, pincode, geocoding columns) without data loss. | `engine`, `SessionLocal`, `Base`, `get_db()`, `run_migrations()` |

#### 2. API Controllers (`backend/app/api/`)

| File Path | Description | Key Endpoints / Functions |
|---|---|---|
| [`backend/app/api/routes_api.py`](file:///c:/Yug%20Shah/DAAA/backend/app/api/routes_api.py) | **Primary REST API Router (32 Endpoints)**<br/>Handles requests for:<br/>• Dashboard summaries (`/api/dashboard/summary`)<br/>• Order management & CSV import (`/api/orders`, `/api/orders/import`, `/api/orders/export`)<br/>• Vehicle fleet management & telemetry (`/api/vehicles`, `/api/vehicles/{id}/location`)<br/>• Problem analysis & route optimization (`/api/optimization/analyze`, `/api/optimization/run`)<br/>• Simulation controls (`/api/simulation/start`, `/api/simulation/stop`, `/api/simulation/status`)<br/>• ML model audit info (`/api/ml/metrics`, `/api/ml/model-info`)<br/>• Demo data seeding (`/api/demo/seed`, `/api/demo/clear`) | `router`, `health_check()`, `get_dashboard_summary()`, `import_orders_csv()`, `analyze_optimization_problem()`, `run_optimization()`, `verify_simulation_api_key()` |

#### 3. Data Models & Schemas (`backend/app/models/` & `schemas/`)

| File Path | Description | Key Classes / Entities |
|---|---|---|
| [`backend/app/models/entities.py`](file:///c:/Yug%20Shah/DAAA/backend/app/models/entities.py) | **SQLAlchemy ORM Entities (11 Tables)**<br/>Defines relational schema for logistics objects and audit logs:<br/>• `Warehouse`: Depot locations (Pune Central Depot)<br/>• `Customer`: Customer profile and default address<br/>• `Order`: Package weight, priority, time windows, geocoding status<br/>• `Vehicle`: Max capacity, load, status, coordinates<br/>• `Route`: Total distance, duration, utilization, road polyline JSON<br/>• `RouteStop`: Stop sequence, stop type, ETA, lateness flag<br/>• `OptimizationRun`: Run audit log (score, strategy, distance saved, improvement %)<br/>• `OptimizationMetric`: Key-value metrics per run<br/>• `VehicleLocation`: GPS telemetry history log<br/>• `ModelVersion`: Trained ML model audit record<br/>• `RoutingCache`: Cached OSRM road geometry and durations | `Warehouse`, `Customer`, `Order`, `Vehicle`, `Route`, `RouteStop`, `OptimizationRun`, `OptimizationMetric`, `VehicleLocation`, `ModelVersion`, `RoutingCache` |
| [`backend/app/schemas/schemas.py`](file:///c:/Yug%20Shah/DAAA/backend/app/schemas/schemas.py) | **Pydantic V2 Validation & Serialization Schemas**<br/>Enforces type safety and JSON serialization for API request bodies and responses. Includes schemas for order creation, CSV import results, complexity metrics, ML recommendations, and optimization comparison results. | `OrderCreate`, `OrderResponse`, `VehicleResponse`, `ComplexityAnalysis`, `StrategyRecommendation`, `OptimizationAnalyzeResponse`, `OptimizationRunRequest`, `OptimizationRunResponse`, `DashboardSummaryResponse`, `MLMetricsResponse` |

#### 4. Services & Business Logic (`backend/app/services/`)

| File Path | Description | Key Classes / Functions |
|---|---|---|
| [`backend/app/services/complexity.py`](file:///c:/Yug%20Shah/DAAA/backend/app/services/complexity.py) | **Problem Complexity Feature Extractor**<br/>Computes 8 operational features (order count, vehicle count, capacity tightness, total constraints, priority ratio, tight time window ratio, geographical spread, and average customer distance). Computes normalized Complexity Score (0 to 100) and Complexity Level (`LOW`, `MEDIUM`, `HIGH`). | `ComplexityService.analyze()`, `complexity_service` |
| [`backend/app/services/geocoding.py`](file:///c:/Yug%20Shah/DAAA/backend/app/services/geocoding.py) | **Hybrid Geocoding Pipeline**<br/>Converts customer text addresses to coordinates using a three-tier hierarchy:<br/>1. Internal dictionary of 40+ Pune localities & 25+ PIN codes.<br/>2. OpenStreetMap Nominatim remote API query.<br/>3. Strict validation: Never invents fake coordinates; marks unlocated addresses as `FAILED`. | `GeocodingService.geocode()`, `PUNE_LOCALITIES`, `PUNE_PINCODES`, `geocoding_service` |
| [`backend/app/services/ml_service.py`](file:///c:/Yug%20Shah/DAAA/backend/app/services/ml_service.py) | **ML Strategy Classifier & Safety Arbiter**<br/>Loads pre-trained Random Forest model (`model.joblib`). Evaluates 8 complexity features to predict strategy probabilities (`GREEDY`, `LOCAL_SEARCH`, `GENETIC`). Enforces safety rules (forces Greedy for $\le 6$ orders; upgrades to Hybrid for score $\ge 75$ with $\ge 25$ orders). | `MLStrategyService.predict_strategy()`, `MLStrategyService.get_model_info()`, `ml_strategy_service` |
| [`backend/app/services/routing.py`](file:///c:/Yug%20Shah/DAAA/backend/app/services/routing.py) | **Spatial Distance & Road Routing Engine**<br/>Builds $N \times N$ distance and travel-time matrices using Haversine with a $1.3\times$ urban road curvature factor. Communicates with external OSRM API for turn-by-turn road geometry. Manages in-memory and database routing caches. | `haversine_distance_km()`, `RoutingService.get_route()`, `RoutingService.get_distance_matrix()`, `routing_service` |
| [`backend/app/services/simulation.py`](file:///c:/Yug%20Shah/DAAA/backend/app/services/simulation.py) | **Real-Time GPS Fleet Simulation Engine**<br/>Asynchronous background loop that traverses approved routes segment by segment (6 interpolation steps per leg). Computes instant coordinates, speed, arrival ETAs, marks orders `DELIVERED`, and pushes updates via WebSockets. | `SimulationService.start()`, `SimulationService.stop()`, `SimulationService._tick()`, `simulation_service` |
| [`backend/app/services/websocket_manager.py`](file:///c:/Yug%20Shah/DAAA/backend/app/services/websocket_manager.py) | **WebSocket Connection Pool Manager**<br/>Maintains active client WebSocket connections and broadcasts JSON telemetry frames (`vehicle_location`, `simulation_status`, `optimization_progress`). | `WebSocketManager.connect()`, `WebSocketManager.disconnect()`, `WebSocketManager.broadcast()`, `ws_manager` |

#### 5. Algorithmic Optimization Suite (`backend/app/optimization/`)

| File Path | Description | Key Algorithms & Classes |
|---|---|---|
| [`backend/app/optimization/evaluator.py`](file:///c:/Yug%20Shah/DAAA/backend/app/optimization/evaluator.py) | **Route Evaluator & Constraint Validator**<br/>Evaluates single-vehicle and multi-vehicle candidate solutions against an explicit objective cost function (distance, travel time, lateness penalty $50\times$, capacity penalty $1000\times$, unassigned penalty $5000\times$, duplicate penalty $5000\times$). Checks delivery time windows and enforces 5-min service drop-off times. | `RouteEvaluator.evaluate_vehicle_route()`, `RouteEvaluator.evaluate_solution()` |
| [`backend/app/optimization/greedy.py`](file:///c:/Yug%20Shah/DAAA/backend/app/optimization/greedy.py) | **Greedy Nearest Neighbor Optimizer**<br/>Fast $O(N^2)$ heuristic route builder with priority multipliers (`URGENT: 0.7x`, `HIGH: 0.85x`, `NORMAL: 1.0x`, `LOW: 1.15x`). Overload fallback ensures zero lost orders. Serves as baseline and seed for metaheuristics. | `GreedyOptimizer.solve()` |
| [`backend/app/optimization/local_search.py`](file:///c:/Yug%20Shah/DAAA/backend/app/optimization/local_search.py) | **2-Opt & Relocation Local Search Optimizer**<br/>Iteratively improves initial routes using intra-route 2-Opt edge inversion (uncrosses routes), intra-route 1-Opt relocation, and inter-route customer relocation between vehicles. Bounded by `max_time_seconds`. | `LocalSearchOptimizer.two_opt_route()`, `LocalSearchOptimizer.solve()` |
| [`backend/app/optimization/genetic.py`](file:///c:/Yug%20Shah/DAAA/backend/app/optimization/genetic.py) | **Genetic Algorithm Metaheuristic**<br/>Evolutionary optimizer with chromosome permutation representation, capacity-balanced greedy vehicle decoding, Order Crossover (OX, 85%), swap/inversion mutation (20%), and tournament selection with elitism (top 2 individuals). Seeded with the Greedy solution. | `GeneticOptimizer._decode_chromosome()`, `GeneticOptimizer._order_crossover()`, `GeneticOptimizer.solve()` |
| [`backend/app/optimization/hybrid.py`](file:///c:/Yug%20Shah/DAAA/backend/app/optimization/hybrid.py) | **Memetic Hybrid Optimizer (GA + 2-Opt)**<br/>Two-phase strategy: Phase 1 runs Genetic Algorithm for $80\%$ of runtime budget for global exploration; Phase 2 runs Local Search 2-Opt on the best GA routes for the remaining $20\%$ for local exploitation. | `HybridOptimizer.solve()` |

---

### C. Machine Learning & Benchmarking (`backend/ml/` & `experiments/`)

| File Path | Description | Key Details |
|---|---|---|
| [`backend/ml/dataset_generator.py`](file:///c:/Yug%20Shah/DAAA/backend/ml/dataset_generator.py) | **Synthetic Delivery Scenario Generator**<br/>Generates realistic Pune delivery problems with varying order counts, spatial dispersion, priority mixes, and time windows. Evaluates candidate algorithms to label the optimal strategy. | `generate_dataset()`, outputs to `data/training_data.csv` |
| [`backend/ml/train.py`](file:///c:/Yug%20Shah/DAAA/backend/ml/train.py) | **Random Forest Training Pipeline**<br/>Trains a `RandomForestClassifier` (100 estimators, max depth 6) on the 8 complexity features. Computes accuracy, precision, recall, F1, and feature importances. Serializes model to `model.joblib` and metrics to `metrics.json`. | `train_model()`, produces `model.joblib` & `metrics.json` |
| [`backend/ml/model.joblib`](file:///c:/Yug%20Shah/DAAA/backend/ml/model.joblib) | **Serialized Scikit-learn Model**<br/>Binary model file loaded by `ml_service.py` for sub-10ms inference. | 85.0% accuracy, 100 decision trees |
| [`backend/ml/metrics.json`](file:///c:/Yug%20Shah/DAAA/backend/ml/metrics.json) | **Trained Model Performance Metadata**<br/>JSON recording accuracy (0.85), precision (0.808), recall (0.85), F1 (0.825), sample counts, and feature importance rankings. | Read by `/api/ml/metrics` endpoint |
| [`backend/experiments/run_benchmark.py`](file:///c:/Yug%20Shah/DAAA/backend/experiments/run_benchmark.py) | **Benchmarking Suite**<br/>Executes comparative evaluation runs across Greedy, Local Search, Genetic, and Hybrid algorithms over synthetic scenarios. Logs runtimes, distances, and constraint violations to `data/benchmark_results.csv`. | `run_all_benchmarks()` |
| [`backend/seed.py`](file:///c:/Yug%20Shah/DAAA/backend/seed.py) | **Demo Data Seeding Script**<br/>Populates `delivery.db` with Pune Central Depot, demo delivery vehicles, and sample customer orders across Pune localities. | `seed_database()`, `clear_database()` |

---

### D. Frontend Application (`frontend/`)

#### 1. Configuration & Root Entry

| File Path | Description | Key Details |
|---|---|---|
| [`frontend/package.json`](file:///c:/Yug%20Shah/DAAA/frontend/package.json) | **NPM Package Manifest**<br/>Declares frontend dependencies: `react` (`^19.2.8`), `react-dom`, `leaflet` (`^1.9.4`), `react-leaflet` (`^5.0.0`), `lucide-react`, and dev tools (`vite` `^8.3.0`, `oxlint`). | Scripts: `dev`, `build`, `preview`, `lint` |
| [`frontend/vite.config.js`](file:///c:/Yug%20Shah/DAAA/frontend/vite.config.js) | **Vite Bundler Configuration**<br/>Configures `@vitejs/plugin-react` and local development server settings. | Port: `5173` |
| [`frontend/index.html`](file:///c:/Yug%20Shah/DAAA/frontend/index.html) | **SPA HTML Template**<br/>HTML host page with viewport meta tags, title tag, and root `<div id="root"></div>`. | Loads `src/main.jsx` |
| [`frontend/src/main.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/main.jsx) | **React Application Entrypoint**<br/>Mounts `App` component into the DOM with React 19 `createRoot`. | Renders `<App />` |
| [`frontend/src/App.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/App.jsx) | **Application Shell & Tab Router**<br/>Manages active page navigation, sidebar toggle, WebSocket connection lifecycle, incoming GPS telemetry buffer, and simulation status. | State: `currentPage`, `wsConnected`, `liveVehicles`, `simulationStatus` |
| [`frontend/src/index.css`](file:///c:/Yug%20Shah/DAAA/frontend/src/index.css) | **Global CSS Design System**<br/>Modern dark-mode design tokens, CSS variables, typography, custom scrollbars, badges, buttons, cards, and animations. | Dark theme (`#0b0f19` / `#111827`) |
| [`frontend/src/App.css`](file:///c:/Yug%20Shah/DAAA/frontend/src/App.css) | **Shell Layout Styles**<br/>Sidebar layout, mobile responsive drawer, navigation links, and header status indicators. | Responsive media queries |

#### 2. Services & Components (`frontend/src/services/` & `components/`)

| File Path | Description | Key Exports / Features |
|---|---|---|
| [`frontend/src/services/api.js`](file:///c:/Yug%20Shah/DAAA/frontend/src/services/api.js) | **Frontend API & WebSocket Client**<br/>Encapsulates all HTTP REST fetch calls to the FastAPI backend (`http://localhost:8000/api`) and manages the WebSocket client (`ws://localhost:8000/ws/live`) with exponential backoff reconnect logic. | `api` object (methods: `getDashboard()`, `getOrders()`, `importOrders()`, `runOptimization()`, `startSimulation()`, etc.), `createWebSocket()` |
| [`frontend/src/components/DeliveryMap.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/components/DeliveryMap.jsx) | **Interactive Leaflet Map Component**<br/>Wraps `react-leaflet`. Supports base tile switching (OSM Streets, Esri Modern, Esri Satellite). Renders Pune depot marker, color-coded multi-vehicle route polylines, customer delivery markers with ETA popups, and live-moving vehicle markers. | `DeliveryMap`, `MAP_PROVIDERS`, `ROUTE_COLORS` |

#### 3. Frontend Pages (`frontend/src/pages/`)

| File Path | Page Name | Primary User Functions |
|---|---|---|
| [`frontend/src/pages/DashboardPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/DashboardPage.jsx) | **Operations Dashboard** | High-level fleet KPIs (Total Orders, Pending Orders, Fleet Utilization %, On-Time Delivery Rate), status distribution charts, and recent optimization runs list. |
| [`frontend/src/pages/OrdersPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/OrdersPage.jsx) | **Order Management** | Order table with status filtering, single order deletion, geocoding retry, CSV template download, and bulk CSV drag-and-drop import. |
| [`frontend/src/pages/CreateOrderPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/CreateOrderPage.jsx) | **New Order Creator** | Manual order entry form with customer details, Pune locality selection, PIN code validation, weight, priority, and delivery time window selectors. |
| [`frontend/src/pages/VehiclesPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/VehiclesPage.jsx) | **Fleet Management** | Fleet roster view with vehicle status badges (Available, Assigned, In Transit), capacity progress bars, current payload, and vehicle registration. |
| [`frontend/src/pages/OptimizationPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/OptimizationPage.jsx) | **Route Optimization Center** | Order selection, problem complexity calculation, ML strategy recommendation badge, manual algorithm override selector, penalty weight tuning, before-vs-after savings KPIs, and multi-vehicle route breakdown. |
| [`frontend/src/pages/LiveTrackingPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/LiveTrackingPage.jsx) | **Real-Time Fleet Tracking** | Live simulation controller (Start, Stop, Speed 1x-10x), vehicle selection dropdown, live speed/status gauges, and real-time delivery stop checklist. |
| [`frontend/src/pages/OptimizationHistoryPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/OptimizationHistoryPage.jsx) | **Run Audit History** | Historical log of previous optimization runs with algorithm comparison, runtime in seconds, kilometers saved, and % improvement. |
| [`frontend/src/pages/MLModelPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/MLModelPage.jsx) | **ML Model Explainability** | Displays Random Forest accuracy, precision, recall, F1-score, confusion matrix, training sample counts, and feature importance bar chart. |
| [`frontend/src/pages/PuneMapPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/PuneMapPage.jsx) | **Pune Geographic Overview** | Fullscreen interactive map focusing on the Pune metropolitan area, depot hub, and customer delivery clusters. |
| [`frontend/src/pages/SettingsPage.jsx`](file:///c:/Yug%20Shah/DAAA/frontend/src/pages/SettingsPage.jsx) | **System Settings** | Configuration view for backend API URLs, OSRM endpoints, simulation API key, and demo data reset triggers. |

---

### E. Data Files (`data/`)

| File Path | Description | Key Details |
|---|---|---|
| [`data/sample_orders_input.csv`](file:///c:/Yug%20Shah/DAAA/data/sample_orders_input.csv) | **Sample Delivery Orders CSV** | Pre-formatted CSV file containing sample Pune orders for testing bulk import. |
| [`data/training_data.csv`](file:///c:/Yug%20Shah/DAAA/data/training_data.csv) | **ML Training Dataset** | 500 generated scenario rows with 8 complexity features and labeled ground-truth optimal strategies. |
| [`data/benchmark_results.csv`](file:///c:/Yug%20Shah/DAAA/data/benchmark_results.csv) | **Benchmark Evaluation Results** | Comparative results of Greedy vs. Local Search vs. Genetic vs. Hybrid across problem sizes. |

---

### F. Automated Test Suite (`tests/`)

| File Path | Test Scope | Key Tests |
|---|---|---|
| [`tests/conftest.py`](file:///c:/Yug%20Shah/DAAA/tests/conftest.py) | **Test Fixtures** | Pytest fixtures for in-memory SQLite test database, FastAPI test client, and mock datasets. |
| [`tests/test_api.py`](file:///c:/Yug%20Shah/DAAA/tests/test_api.py) | **REST API Endpoint Tests** | Tests health check, order creation, CSV import, vehicle updates, and simulation authentication. |
| [`tests/test_complexity.py`](file:///c:/Yug%20Shah/DAAA/tests/test_complexity.py) | **Complexity Service Tests** | Validates feature extraction math, normalization, and complexity level boundaries. |
| [`tests/test_geocoding.py`](file:///c:/Yug%20Shah/DAAA/tests/test_geocoding.py) | **Geocoding Service Tests** | Tests Pune locality dictionary resolution, PIN code lookups, and strict rejection of invalid addresses. |
| [`tests/test_optimization.py`](file:///c:/Yug%20Shah/DAAA/tests/test_optimization.py) | **Solver Correctness Tests** | Tests Greedy, Local Search, Genetic, and Hybrid algorithms for capacity enforcement and zero unserved orders. |

---

### G. Documentation Suite (`docs/`)

| File Path | Description | Format |
|---|---|---|
| [`docs/architecture.md`](file:///c:/Yug%20Shah/DAAA/docs/architecture.md) | **Technical System Architecture Specification**<br/>Detailed 8-layer architecture reference with control flow, mathematical constraint definitions, and layer interactions. | Markdown (`.md`) |
| [`docs/architecture.svg`](file:///c:/Yug%20Shah/DAAA/docs/architecture.svg) | **System Architecture Vector Graphic**<br/>Scalable dark-mode technical architecture diagram (1920×1080) with database cylinders and labeled connectors. | Scalable Vector Graphic (`.svg`) |
| [`docs/architecture.png`](file:///c:/Yug%20Shah/DAAA/docs/architecture.png) / [`.jpg`](file:///c:/Yug%20Shah/DAAA/docs/architecture.jpg) | **Rendered Architecture Images**<br/>High-resolution image versions of the architecture diagram for reports and presentations. | Image (`.png` / `.jpg`) |
| [`docs/architecture.mmd`](file:///c:/Yug%20Shah/DAAA/docs/architecture.mmd) | **Mermaid Architecture Source**<br/>Editable Mermaid flowchart source file representing the system architecture. | Mermaid (`.mmd`) |
| [`docs/architecture-explanation.md`](file:///c:/Yug%20Shah/DAAA/docs/architecture-explanation.md) | **Beginner-Friendly Architecture & Viva Guide**<br/>Plain-English component breakdown and Q&A guide prepared for 3rd-year B.Tech CSE (AI & ML) project defense. | Markdown (`.md`) |
| [`docs/file-architecture.md`](file:///c:/Yug%20Shah/DAAA/docs/file-architecture.md) | **Codebase File Architecture Reference** (This document)<br/>Complete file-by-file inventory, responsibility descriptions, and cross-layer call graphs. | Markdown (`.md`) |
| [`docs/api.md`](file:///c:/Yug%20Shah/DAAA/docs/api.md) | **API Reference Documentation**<br/>HTTP methods, endpoints, request parameters, and response schemas for all 32 backend routes. | Markdown (`.md`) |
| [`docs/optimization.md`](file:///c:/Yug%20Shah/DAAA/docs/optimization.md) | **DAA Optimization Algorithms Guide**<br/>Pseudocode and algorithmic explanation of Greedy, 2-Opt Local Search, Genetic Algorithm, and Hybrid Optimizer. | Markdown (`.md`) |
| [`docs/ml_pipeline.md`](file:///c:/Yug%20Shah/DAAA/docs/ml_pipeline.md) | **Machine Learning Pipeline Guide**<br/>Dataset generation, feature engineering, Random Forest training, and classification metrics. | Markdown (`.md`) |
| [`docs/database.md`](file:///c:/Yug%20Shah/DAAA/docs/database.md) | **Database Schema & Entity Relationship Guide**<br/>Table schemas, column data types, foreign key relationships, and migration procedures. | Markdown (`.md`) |
| [`docs/deployment.md`](file:///c:/Yug%20Shah/DAAA/docs/deployment.md) | **Deployment & Production Guide**<br/>Instructions for running with Docker, Uvicorn in production, and connecting PostgreSQL. | Markdown (`.md`) |

---

## 3. Cross-Layer Module Call Graph

The diagram below shows how files across different directories call and depend on each other:

```
[frontend/src/pages/OptimizationPage.jsx]
           │
           ▼
[frontend/src/services/api.js]
           │  (HTTP POST /api/optimization/run)
           ▼
[backend/app/api/routes_api.py: run_optimization]
           │
           ├───► [backend/app/services/complexity.py: analyze]
           │             │
           │             ▼
           ├───► [backend/app/services/ml_service.py: predict_strategy]
           │             │
           │             ▼ (Loads model.joblib)
           │     [backend/ml/model.joblib]
           │
           ├───► [backend/app/services/routing.py: get_distance_matrix]
           │
           ├───► [backend/app/optimization/Algorithm Selector]
           │             │
           │             ├───► [backend/app/optimization/greedy.py]
           │             ├───► [backend/app/optimization/local_search.py]
           │             ├───► [backend/app/optimization/genetic.py]
           │             └───► [backend/app/optimization/hybrid.py]
           │                           │
           │                           ▼
           ├───► [backend/app/optimization/evaluator.py: evaluate_solution]
           │
           ├───► [backend/app/services/routing.py: get_route (OSRM)]
           │
           ├───► [backend/app/database.py: SessionLocal]
           │             │
           │             ▼
           ├───► [backend/app/models/entities.py: Route, RouteStop, OptimizationRun]
           │             │
           │             ▼
           │     [delivery.db (SQLite Database)]
           │
           └───► [backend/app/services/websocket_manager.py: broadcast]
                         │
                         ▼ (WebSocket Frame: /ws/live)
                 [frontend/src/services/api.js]
                         │
                         ▼
                 [frontend/src/components/DeliveryMap.jsx]
```

---

## 4. Key Verification Metrics

- **Total Tracked Project Files**: 76 files (excluding `node_modules`, `.git`, `__pycache__`, and `dist`).
- **Backend Python Code Files**: 24 files across `app/`, `ml/`, `experiments/`, and root.
- **Frontend Source Files**: 19 files across `pages/`, `components/`, and `services/`.
- **Database Tables Managed**: 11 relational entities.
- **Backend API Endpoints**: 32 registered routes.
- **Optimization Solvers**: 4 verified algorithms + 1 central evaluation engine.
