# RouteOptimaAI — System Architecture Blueprint

> **System Architecture Recreated from Reference Architecture Diagram**  
> *AI-Based Complexity-Aware Capacitated Vehicle Routing Problem with Time Windows (CVRPTW)*

---

## 1. Executive System Overview

**RouteOptimaAI** is an AI-driven, complexity-aware last-mile delivery route optimization and real-time fleet simulation system. The architecture is engineered to solve the **Capacitated Vehicle Routing Problem with Time Windows (CVRPTW)** by bridging the gap between computational latency and solution quality.

Instead of applying a single heuristic or brute-force metaheuristic to all routing instances, the system:
1. Ingests customer order batches and fleet vehicle configurations.
2. Geocodes customer addresses via a multi-tiered resolution pipeline (local dictionaries, postal PIN mapping, and remote OpenStreetMap fallback).
3. Extracts an 8-dimensional operational complexity feature vector.
4. Uses an offline-trained **Machine Learning Strategy Classifier** (Random Forest, 85% accuracy) coupled with a deterministic safety and feasibility arbiter to predict the most cost-effective algorithm.
5. Dispatches execution to a **Design and Analysis of Algorithms (DAA) Optimization Engine** offering specialized algorithmic solvers: **Greedy Nearest Neighbor**, **2-Opt & Relocation Local Search**, **Order Crossover Genetic Algorithm**, and a **Memetic Hybrid Optimizer**.
6. Enforces strict feasibility constraints through a comprehensive **Route Evaluator** (vehicle capacity limits, arrival time windows, service lateness, and zero unassigned or duplicate orders).
7. Interlaces street-accurate geometry via an **OSRM Routing Engine** and Haversine matrix builder.
8. Drives a real-time **Asyncio Fleet Simulation Engine** that broadcasts live interpolated GPS coordinates to the interactive frontend dashboard via WebSockets.

---

## 2. Recreated System Architecture Diagrams

### 2.1 Complete Overall System Architecture Diagram

The flowchart below reproduces the complete reference architecture diagram from left to right (`flowchart LR`), faithfully capturing all 38 components, cylinder storage nodes, warning nodes, directed connectors, and label annotations.

```mermaid
%%{init: {
  'theme': 'dark',
  'themeVariables': {
    'darkMode': true,
    'background': '#0e1117',
    'primaryColor': '#1e222b',
    'primaryTextColor': '#ffffff',
    'primaryBorderColor': '#4a5568',
    'lineColor': '#718096',
    'secondaryColor': '#161920',
    'tertiaryColor': '#2d3748',
    'fontFamily': 'Inter, system-ui, sans-serif'
  }
}}%%

flowchart LR
    %% User & Presentation
    User["User: orders CSV or config"] -->|upload & configure| Frontend["React + Vite frontend"]
    Frontend -->|history & filters| BrowserStorage[("Browser localStorage")]
    Frontend -->|POST /api/orders/import| Backend["FastAPI backend"]
    Frontend -->|POST /api/optimization/run| Backend
    Frontend -->|POST /api/simulation/start| Backend
    Backend -->|WebSocket /ws/live| Frontend
    Backend -->|structured JSON result| Frontend

    %% Backend Subsystems Branching
    Backend -->|geocode address| GeocodeRouter["Geocoding router"]
    Backend -->|extract 8 features| ComplexityBuilder["Complexity feature builder"]
    Backend -->|select & execute| DAAEngine["DAA optimization engine"]
    Backend -->|driving road geometry| RoutingService["Routing & distance service"]
    Backend -->|background loop| SimEngine["Asyncio simulation engine"]
    Backend -->|SQLAlchemy ORM| DBStorage[("SQLite database delivery.db")]

    %% Geocoding Branch
    GeocodeRouter -->|local match| PuneDict[("Local Pune dictionary - 40+ areas")]
    GeocodeRouter -->|PIN match| PunePIN[("Pune PIN code map - 25+ PINs")]
    GeocodeRouter -->|remote query| NominatimAPI["Nominatim OSM API"]
    GeocodeRouter -->|unresolved| StrictFail["Strict validation - status FAILED"]

    %% Complexity & ML Strategy Classifier Branch
    ComplexityBuilder -->|normalized vector| MLClassifier["ML strategy classifier"]
    MLClassifier -->|model configured| RFModel[("Random Forest - model.joblib 85%")]
    MLClassifier -->|fallback mode| RuleHeuristics["Deterministic heuristics"]
    MLClassifier -->|predicted strategy| StratArbiter["Safety & feasibility arbiter"]

    %% Strategy Arbiter Dispatches to DAA Solvers
    StratArbiter -->|selected strategy| DAAEngine

    %% DAA Optimization Solvers
    DAAEngine -->|orders <= 6 or low complexity| GreedySolver["Greedy nearest neighbor"]
    DAAEngine -->|moderate complexity / 2-opt| LocalSearchSolver["Local search - 2-Opt & relocation"]
    DAAEngine -->|high complexity / genetic| GeneticSolver["Genetic algorithm - Order Crossover"]
    DAAEngine -->|score >= 75 & orders >= 25| HybridSolver["Hybrid optimizer - GA + 2-Opt"]

    %% Solver Solutions to Route Evaluator
    GreedySolver -->|candidate solution| RouteEvaluator["Route evaluator & constraint checks"]
    LocalSearchSolver -->|candidate solution| RouteEvaluator
    GeneticSolver -->|candidate solution| RouteEvaluator
    HybridSolver -->|candidate solution| RouteEvaluator

    %% Constraint Checks
    RouteEvaluator -->|validate capacity| CapCheck["Vehicle capacity limit check"]
    RouteEvaluator -->|validate arrival vs end| TWCheck["Time window & lateness check"]
    RouteEvaluator -->|order coverage| CoverageCheck["Zero unassigned & duplicate check"]

    %% Routing & OSRM Branch
    RoutingService -->|sub-millisecond matrix| MatrixBuilder["Haversine 1.3x matrix builder"]
    RoutingService -->|turn-by-turn road polyline| OSRMClient["OSRM routing engine"]
    OSRMClient -->|HTTP GET /route/v1/driving| OSRMAPI["External OSRM public API"]
    RoutingService -->|cached road segments| RoutingCache[("routing_cache table")]

    %% Simulation Engine Branch
    SimEngine -->|segment interpolation| TelemetryGen["Live GPS telemetry generator"]
    TelemetryGen -->|broadcast position| WSManager["WebSocket connection manager"]
    WSManager -->|live vehicle coords| Frontend
    TelemetryGen -->|persist location audit| LocHistory[("vehicle_locations table")]

    %% Database Entities
    DBStorage --- OrdersTable[("orders table")]
    DBStorage --- VehiclesTable[("vehicles table")]
    DBStorage --- RoutesTable[("routes & route_stops")]
    DBStorage --- RunsTable[("optimization_runs & metrics")]
    DBStorage --- ModelsTable[("model_versions table")]

    %% Node Styling matching reference aesthetic
    classDef default fill:#161920,stroke:#4a5568,stroke-width:1.2px,color:#ffffff;
    classDef cylinderNode fill:#1c212d,stroke:#5a67d8,stroke-width:1.5px,color:#e2e8f0;
    classDef highlightNode fill:#1a2332,stroke:#3182ce,stroke-width:1.5px,color:#ffffff;
    classDef warningNode fill:#2d1519,stroke:#e53e3e,stroke-width:1.2px,color:#feb2b2;

    class BrowserStorage,PuneDict,PunePIN,RFModel,RoutingCache,LocHistory,DBStorage,OrdersTable,VehiclesTable,RoutesTable,RunsTable,ModelsTable cylinderNode;
    class Frontend,Backend,DAAEngine,MLClassifier,RoutingService,SimEngine highlightNode;
    class StrictFail warningNode;
```

---

### 2.2 Input Processing, Client, and Backend Gateway Architecture

This detailed view highlights user interaction, browser-side caching, REST endpoints, and bidirectional communication channels.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    User["User: orders CSV or config"] -->|upload & configure| Frontend["React + Vite frontend"]
    Frontend -->|history & filters| BrowserStorage[("Browser localStorage")]
    
    Frontend -->|POST /api/orders/import| Backend["FastAPI backend"]
    Frontend -->|POST /api/optimization/run| Backend
    Frontend -->|POST /api/simulation/start| Backend
    
    Backend -->|WebSocket /ws/live| Frontend
    Backend -->|structured JSON result| Frontend

    WSManager["WebSocket connection manager"] -->|live vehicle coords| Frontend

    classDef default fill:#161920,stroke:#4a5568,stroke-width:1.2px,color:#ffffff;
    classDef cylinderNode fill:#1c212d,stroke:#5a67d8,stroke-width:1.5px,color:#e2e8f0;
    classDef highlightNode fill:#1a2332,stroke:#3182ce,stroke-width:1.5px,color:#ffffff;
    class BrowserStorage cylinderNode;
    class Frontend,Backend highlightNode;
```

---

### 2.3 Geocoding & Address Resolution Pipeline

This subsystem details the resolution path for addresses, beginning with local databases for fast sub-millisecond responses, failing over to external OpenStreetMap queries, and terminating in strict validation if coordinates cannot be established.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    Backend["FastAPI backend"] -->|geocode address| GeocodeRouter["Geocoding router"]
    
    GeocodeRouter -->|local match| PuneDict[("Local Pune dictionary - 40+ areas")]
    GeocodeRouter -->|PIN match| PunePIN[("Pune PIN code map - 25+ PINs")]
    GeocodeRouter -->|remote query| NominatimAPI["Nominatim OSM API"]
    GeocodeRouter -->|unresolved| StrictFail["Strict validation - status FAILED"]

    classDef default fill:#161920,stroke:#4a5568,stroke-width:1.2px,color:#ffffff;
    classDef cylinderNode fill:#1c212d,stroke:#5a67d8,stroke-width:1.5px,color:#e2e8f0;
    classDef highlightNode fill:#1a2332,stroke:#3182ce,stroke-width:1.5px,color:#ffffff;
    classDef warningNode fill:#2d1519,stroke:#e53e3e,stroke-width:1.2px,color:#feb2b2;
    class PuneDict,PunePIN cylinderNode;
    class Backend highlightNode;
    class StrictFail warningNode;
```

---

### 2.4 ML Complexity Analysis & Strategy Classification Pipeline

This subsystem extracts 8 operational features, feeds a normalized vector to the ML model, incorporates fallback heuristics, and uses a safety arbiter before dispatching to the optimization engine.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    Backend["FastAPI backend"] -->|extract 8 features| ComplexityBuilder["Complexity feature builder"]
    ComplexityBuilder -->|normalized vector| MLClassifier["ML strategy classifier"]
    
    MLClassifier -->|model configured| RFModel[("Random Forest - model.joblib 85%")]
    MLClassifier -->|fallback mode| RuleHeuristics["Deterministic heuristics"]
    MLClassifier -->|predicted strategy| StratArbiter["Safety & feasibility arbiter"]
    
    StratArbiter -->|selected strategy| DAAEngine["DAA optimization engine"]

    classDef default fill:#161920,stroke:#4a5568,stroke-width:1.2px,color:#ffffff;
    classDef cylinderNode fill:#1c212d,stroke:#5a67d8,stroke-width:1.5px,color:#e2e8f0;
    classDef highlightNode fill:#1a2332,stroke:#3182ce,stroke-width:1.5px,color:#ffffff;
    class RFModel cylinderNode;
    class Backend,MLClassifier,DAAEngine highlightNode;
```

---

### 2.5 DAA Optimization Engine & Route Evaluator Pipeline

This subsystem routes the problem to the appropriate algorithmic solver based on instance size and complexity score, and then subjects candidate solutions to rigorous physical feasibility checks.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    DAAEngine["DAA optimization engine"] -->|orders <= 6 or low complexity| GreedySolver["Greedy nearest neighbor"]
    DAAEngine -->|moderate complexity / 2-opt| LocalSearchSolver["Local search - 2-Opt & relocation"]
    DAAEngine -->|high complexity / genetic| GeneticSolver["Genetic algorithm - Order Crossover"]
    DAAEngine -->|score >= 75 & orders >= 25| HybridSolver["Hybrid optimizer - GA + 2-Opt"]

    GreedySolver -->|candidate solution| RouteEvaluator["Route evaluator & constraint checks"]
    LocalSearchSolver -->|candidate solution| RouteEvaluator
    GeneticSolver -->|candidate solution| RouteEvaluator
    HybridSolver -->|candidate solution| RouteEvaluator

    RouteEvaluator -->|validate capacity| CapCheck["Vehicle capacity limit check"]
    RouteEvaluator -->|validate arrival vs end| TWCheck["Time window & lateness check"]
    RouteEvaluator -->|order coverage| CoverageCheck["Zero unassigned & duplicate check"]

    classDef default fill:#161920,stroke:#4a5568,stroke-width:1.2px,color:#ffffff;
    classDef highlightNode fill:#1a2332,stroke:#3182ce,stroke-width:1.5px,color:#ffffff;
    class DAAEngine highlightNode;
```

---

### 2.6 Routing Service & Live Fleet Simulation Pipeline

This subsystem handles matrix creation, street routing polylines, segment-by-segment interpolation for vehicle movements, WebSocket broadcasting, and historical telemetry logging.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    Backend["FastAPI backend"] -->|driving road geometry| RoutingService["Routing & distance service"]
    Backend -->|background loop| SimEngine["Asyncio simulation engine"]

    RoutingService -->|sub-millisecond matrix| MatrixBuilder["Haversine 1.3x matrix builder"]
    RoutingService -->|turn-by-turn road polyline| OSRMClient["OSRM routing engine"]
    OSRMClient -->|HTTP GET /route/v1/driving| OSRMAPI["External OSRM public API"]
    RoutingService -->|cached road segments| RoutingCache[("routing_cache table")]

    SimEngine -->|segment interpolation| TelemetryGen["Live GPS telemetry generator"]
    TelemetryGen -->|broadcast position| WSManager["WebSocket connection manager"]
    TelemetryGen -->|persist location audit| LocHistory[("vehicle_locations table")]
    WSManager -->|live vehicle coords| Frontend["React + Vite frontend"]

    classDef default fill:#161920,stroke:#4a5568,stroke-width:1.2px,color:#ffffff;
    classDef cylinderNode fill:#1c212d,stroke:#5a67d8,stroke-width:1.5px,color:#e2e8f0;
    classDef highlightNode fill:#1a2332,stroke:#3182ce,stroke-width:1.5px,color:#ffffff;
    class RoutingCache,LocHistory cylinderNode;
    class Backend,RoutingService,SimEngine,Frontend highlightNode;
```

---

### 2.7 Database Persistence Architecture

This subsystem represents the SQLite relational storage managed via SQLAlchemy ORM, detailing the central database and its key relational tables.

```mermaid
%%{init: {'theme': 'dark'}}%%
flowchart LR
    Backend["FastAPI backend"] -->|SQLAlchemy ORM| DBStorage[("SQLite database delivery.db")]

    DBStorage --- OrdersTable[("orders table")]
    DBStorage --- VehiclesTable[("vehicles table")]
    DBStorage --- RoutesTable[("routes & route_stops")]
    DBStorage --- RunsTable[("optimization_runs & metrics")]
    DBStorage --- ModelsTable[("model_versions table")]

    classDef default fill:#161920,stroke:#4a5568,stroke-width:1.2px,color:#ffffff;
    classDef cylinderNode fill:#1c212d,stroke:#5a67d8,stroke-width:1.5px,color:#e2e8f0;
    classDef highlightNode fill:#1a2332,stroke:#3182ce,stroke-width:1.5px,color:#ffffff;
    class DBStorage,OrdersTable,VehiclesTable,RoutesTable,RunsTable,ModelsTable cylinderNode;
    class Backend highlightNode;
```

---

## 3. Technical Documentation

### A. System Overview

The system depicted in the reference architecture represents **RouteOptimaAI**, an enterprise-grade vehicle routing optimization and real-time execution engine. Last-mile urban logistics operations face significant challenges:
- High combinatorial complexity ($O(N!)$ or NP-hard).
- Heterogeneous fleet capacities and tight customer-specified delivery time windows.
- Dynamic road network geometry and live dispatch updates.
- The latency vs. optimality trade-off: operations teams cannot wait minutes for metaheuristics on small routes, nor can they accept suboptimal greedy solutions on dense, heavily constrained delivery clusters.

RouteOptimaAI solves this by implementing an **AI-driven complexity arbiter** that dynamically routes problem instances to the most appropriate solver, validates the resulting routes against all operational constraints, computes driving polylines, and simulates vehicle telemetry in real time.

---

### B. Architecture Layers

The architecture is divided into eight clearly identifiable logical layers:

1. **User & Presentation Layer (Client Side)**
   - Responsible for dispatcher interaction, order upload via CSV or UI configuration, view filtering, and rendering route maps and live telemetric vehicle markers.
2. **API Gateway & Telemetry Broker Layer**
   - Built on FastAPI. Manages REST request dispatching, validation, error handling, and WebSocket broadcast connections.
3. **Address Resolution & Geocoding Layer**
   - Translates human-readable addresses into verified geographic coordinates through a multi-stage fallback hierarchy.
4. **Complexity Feature Extraction & ML Strategy Classification Layer**
   - Analyzes scenario characteristics across 8 metrics, invokes a trained Random Forest model (or fallback heuristics), and arbitrates the final solver choice.
5. **DAA Optimization Engine & Solvers Layer**
   - Executes the selected algorithmic strategy (Greedy, 2-Opt Local Search, Genetic Algorithm, or Hybrid) to generate candidate vehicle routes.
6. **Route Evaluation & Feasibility Constraint Layer**
   - Rigorously scores candidate routes and enforces strict penalties for capacity violations, time-window lateness, and unassigned or duplicated orders.
7. **Spatial Routing & Distance Service Layer**
   - Builds $N \times N$ distance and travel time matrices using Haversine distance with road curvature adjustments, queries OSRM for street-level polylines, and caches road geometry.
8. **Live Fleet Simulation & Persistence Layer**
   - Steps vehicles along driving paths, computes real-time GPS coordinates, broadcasts updates over WebSockets, and persists all system entities in an ACID SQLite database.

---

### C. Component Descriptions

Every identifiable component from the reference image is documented below with its exact label, operational purpose, inputs, processing logic, outputs, and connections:

#### 1. User: orders CSV or config
- **Component Name:** `User: orders CSV or config`
- **Purpose:** Primary system actor and trigger; represents a logistics dispatcher, fleet manager, or automated system uploading delivery manifests.
- **Input:** Delivery manifests in CSV format or parameter configurations via the user interface.
- **Processing Performed:** Formulates dispatch parameters, specifies vehicle availability, and submits orders.
- **Output:** Raw CSV files, order attributes, and configuration payloads.
- **Connections:** Connects to `React + Vite frontend` via `upload & configure`.

#### 2. React + Vite frontend
- **Component Name:** `React + Vite frontend`
- **Purpose:** Single-page web application providing the graphical user interface for route management, spatial mapping, and simulation controls.
- **Input:** User interactions, CSV files, configuration parameters, structured JSON results from the backend, and live vehicle coordinates via WebSockets.
- **Processing Performed:** Client-side form handling, state management, Leaflet map rendering of route polylines, live vehicle animation, and caching.
- **Output:** HTTP REST requests (`/api/orders/import`, `/api/optimization/run`, `/api/simulation/start`) and local storage updates.
- **Connections:**
  - Receives from `User: orders CSV or config` via `upload & configure`.
  - Sends to `Browser localStorage` via `history & filters`.
  - Sends to `FastAPI backend` via `POST /api/orders/import`.
  - Sends to `FastAPI backend` via `POST /api/optimization/run`.
  - Sends to `FastAPI backend` via `POST /api/simulation/start`.
  - Receives from `FastAPI backend` via `WebSocket /ws/live`.
  - Receives from `FastAPI backend` via `structured JSON result`.
  - Receives from `WebSocket connection manager` via `live vehicle coords`.

#### 3. Browser localStorage
- **Component Name:** `Browser localStorage` (Cylindrical Data Store)
- **Purpose:** Client-side persistent key-value storage.
- **Input:** Active UI filters, table sort states, vehicle visibility toggles, and recent dispatch history.
- **Processing Performed:** Serializes and retrieves JSON state blobs in the browser runtime.
- **Output:** Cached filter states and recent configuration preferences.
- **Connections:** Connected with `React + Vite frontend` via `history & filters`.

#### 4. FastAPI backend
- **Component Name:** `FastAPI backend`
- **Purpose:** Central asynchronous application gateway, controller, and orchestrator.
- **Input:** REST API payloads from the frontend, database queries, and internal service signals.
- **Processing Performed:** Request validation with Pydantic schemas, security verification, routing requests to internal subsystems, coordinating database transactions, and dispatching async simulation loops.
- **Output:** Structured JSON responses, WebSocket event streams, and internal procedure calls.
- **Connections:**
  - Receives REST requests from `React + Vite frontend`.
  - Emits `WebSocket /ws/live` and `structured JSON result` to `React + Vite frontend`.
  - Calls `Geocoding router` with `geocode address`.
  - Calls `Complexity feature builder` with `extract 8 features`.
  - Calls `DAA optimization engine` with `select & execute`.
  - Calls `Routing & distance service` with `driving road geometry`.
  - Spawns `Asyncio simulation engine` with `background loop`.
  - Interacts with `SQLite database delivery.db` with `SQLAlchemy ORM`.

#### 5. Geocoding router
- **Component Name:** `Geocoding router`
- **Purpose:** Coordinates address resolution to latitude and longitude coordinates.
- **Input:** Raw address strings and postal codes extracted from imported orders.
- **Processing Performed:** Implements a prioritized lookup strategy: matches against internal locality dictionary, matches against internal postal PIN mapping, queries external Nominatim API, and raises strict failure if unresolved.
- **Output:** Latitude and longitude coordinates, or error flags.
- **Connections:**
  - Invoked by `FastAPI backend` via `geocode address`.
  - Queries `Local Pune dictionary - 40+ areas` via `local match`.
  - Queries `Pune PIN code map - 25+ PINs` via `PIN match`.
  - Queries `Nominatim OSM API` via `remote query`.
  - Directs unresolved entries to `Strict validation - status FAILED` via `unresolved`.

#### 6. Local Pune dictionary - 40+ areas
- **Component Name:** `Local Pune dictionary - 40+ areas` (Cylindrical Data Store)
- **Purpose:** In-memory local lookup table of verified geographic coordinates for 40+ major Pune metropolitan localities.
- **Input:** Locality name strings (e.g., Baner, Kothrud, Hinjewadi, Wakad, Viman Nagar).
- **Processing Performed:** Exact and normalized string matching with zero network latency ($< 1\text{ ms}$).
- **Output:** Verified latitude and longitude coordinates.
- **Connections:** Accessed by `Geocoding router` via `local match`.

#### 7. Pune PIN code map - 25+ PINs
- **Component Name:** `Pune PIN code map - 25+ PINs` (Cylindrical Data Store)
- **Purpose:** Curated table mapping 25+ postal PIN codes (`411001` through `412207`) to centroid coordinates.
- **Input:** 6-digit postal PIN code strings.
- **Processing Performed:** Dictionary key lookup for postal zones.
- **Output:** Verified latitude and longitude coordinates.
- **Connections:** Accessed by `Geocoding router` via `PIN match`.

#### 8. Nominatim OSM API
- **Component Name:** `Nominatim OSM API` (External Service)
- **Purpose:** External OpenStreetMap forward geocoding service for resolving unlisted addresses.
- **Input:** Structured HTTP GET requests with raw address queries.
- **Processing Performed:** Remote spatial search over global OpenStreetMap database.
- **Output:** JSON array containing bounding boxes and coordinate pairs.
- **Connections:** Queried by `Geocoding router` via `remote query`.

#### 9. Strict validation - status FAILED
- **Component Name:** `Strict validation - status FAILED` (Warning / Terminal Node)
- **Purpose:** Rejects orders that cannot be geocoded to prevent downstream algorithmic errors.
- **Input:** Unresolved address records from the geocoding pipeline.
- **Processing Performed:** Flags the order with `FAILED` status, logs an error event, and excludes it from the optimization manifest. Prevents synthetic coordinate generation.
- **Output:** Validation failure record and audit notification.
- **Connections:** Triggered by `Geocoding router` via `unresolved`.

#### 10. Complexity feature builder
- **Component Name:** `Complexity feature builder`
- **Purpose:** Mathematical feature extraction module characterizing routing scenario difficulty.
- **Input:** Order list, vehicle fleet parameters, spatial coordinates, time window constraints, and package weights.
- **Processing Performed:** Computes 8 normalized operational metrics:
  1. `order_count` (normalized scale)
  2. `vehicle_count` (available fleet)
  3. `geographic_spread` (convex hull / bounding box dispersion in km)
  4. `capacity_utilization` (total order demand vs. total vehicle capacity)
  5. `time_window_tightness` (average time window duration in minutes)
  6. `constraint_density` (proportion of orders with strict constraints)
  7. `spatial_clustering` (k-means / spatial variance coefficient)
  8. `demand_variance` (standard deviation of parcel weights)
- **Output:** 8-element normalized numerical feature vector $[f_1, f_2, \dots, f_8]$.
- **Connections:**
  - Invoked by `FastAPI backend` via `extract 8 features`.
  - Delivers vector to `ML strategy classifier` via `normalized vector`.

#### 11. ML strategy classifier
- **Component Name:** `ML strategy classifier`
- **Purpose:** Machine learning inference engine predicting the most suitable optimization algorithm.
- **Input:** 8-dimensional normalized complexity feature vector.
- **Processing Performed:** Evaluates pre-trained model; if model is absent or corrupt, falls back to deterministic rule-based heuristics.
- **Output:** Predicted algorithm class (`GREEDY`, `LOCAL_SEARCH`, `GENETIC`, or `HYBRID`).
- **Connections:**
  - Receives vector from `Complexity feature builder` via `normalized vector`.
  - Loads model from `Random Forest - model.joblib 85%` via `model configured`.
  - Falls back to `Deterministic heuristics` via `fallback mode`.
  - Forwards candidate choice to `Safety & feasibility arbiter` via `predicted strategy`.

#### 12. Random Forest - model.joblib 85%
- **Component Name:** `Random Forest - model.joblib 85%` (Cylindrical Data Store)
- **Purpose:** Serialized scikit-learn ensemble model trained on synthetic and historical CVRPTW problem benchmarks.
- **Input:** Feature vector fed during inference.
- **Processing Performed:** Multi-tree decision voting achieving 85.0% classification accuracy.
- **Output:** Class probability distributions and predicted strategy.
- **Connections:** Read by `ML strategy classifier` via `model configured`.

#### 13. Deterministic heuristics
- **Component Name:** `Deterministic heuristics`
- **Purpose:** Static rule-based decision fallback ensuring the system remains functional even without the ML model.
- **Input:** Raw order count and basic complexity thresholds.
- **Processing Performed:** Hard-coded conditional decision trees based on operational problem size.
- **Output:** Default algorithmic strategy recommendation.
- **Connections:** Invoked by `ML strategy classifier` via `fallback mode`.

#### 14. Safety & feasibility arbiter
- **Component Name:** `Safety & feasibility arbiter`
- **Purpose:** Decision boundary enforcement and sanity-checking component that guarantees physical realism.
- **Input:** Predicted strategy from ML classifier, problem dimensions, and operational parameters.
- **Processing Performed:** Enforces override policies:
  - Small problems ($\le 6$ orders) are forced to `Greedy` to prevent unnecessary metaheuristic latency.
  - Very large or tightly constrained problems (complexity score $\ge 75$ with orders $\ge 25$) are upgraded to `Hybrid`.
- **Output:** Final ratified algorithm selection.
- **Connections:**
  - Receives input from `ML strategy classifier` via `predicted strategy`.
  - Emits chosen algorithm to `DAA optimization engine` via `selected strategy`.

#### 15. DAA optimization engine
- **Component Name:** `DAA optimization engine`
- **Purpose:** Core algorithmic dispatcher orchestrating route optimization solvers.
- **Input:** Dispatched execution signal from `FastAPI backend`, selected strategy from `Safety & feasibility arbiter`, distance/time matrices, orders, and vehicle fleet.
- **Processing Performed:** Instantiates the selected solver instance, configures termination parameters, and executes the routing algorithm.
- **Output:** Dispatch instructions to specific solver implementations.
- **Connections:**
  - Triggered by `FastAPI backend` via `select & execute`.
  - Guided by `Safety & feasibility arbiter` via `selected strategy`.
  - Dispatches to `Greedy nearest neighbor` via `orders <= 6 or low complexity`.
  - Dispatches to `Local search - 2-Opt & relocation` via `moderate complexity / 2-opt`.
  - Dispatches to `Genetic algorithm - Order Crossover` via `high complexity / genetic`.
  - Dispatches to `Hybrid optimizer - GA + 2-Opt` via `score >= 75 & orders >= 25`.

#### 16. Greedy nearest neighbor
- **Component Name:** `Greedy nearest neighbor`
- **Purpose:** Low-latency baseline solver ($O(N^2)$ time complexity) for trivial or real-time low-complexity routing instances.
- **Input:** Order list, distance matrix, and vehicle capacities.
- **Processing Performed:** Sequentially assigns the closest feasible unvisited order to the active vehicle, applying urgency multipliers (`URGENT: 0.7x`, `HIGH: 0.85x`, `NORMAL: 1.0x`, `LOW: 1.15x`).
- **Output:** Candidate multi-vehicle route solution.
- **Connections:**
  - Dispatched from `DAA optimization engine`.
  - Transmits result to `Route evaluator & constraint checks` via `candidate solution`.

#### 17. Local search - 2-Opt & relocation
- **Component Name:** `Local search - 2-Opt & relocation`
- **Purpose:** Iterative improvement metaheuristic for moderate-complexity instances.
- **Input:** Initial tour, distance matrix, and vehicle constraints.
- **Processing Performed:** Eliminates crossing paths using intra-route 2-Opt edge swaps and performs inter-route customer relocations across vehicles until local optimality is reached.
- **Output:** Candidate multi-vehicle route solution.
- **Connections:**
  - Dispatched from `DAA optimization engine`.
  - Transmits result to `Route evaluator & constraint checks` via `candidate solution`.

#### 18. Genetic algorithm - Order Crossover
- **Component Name:** `Genetic algorithm - Order Crossover`
- **Purpose:** Population-based evolutionary metaheuristic designed for high-complexity combinatorial spaces.
- **Input:** Initial randomized population, distance matrix, and mutation/crossover probabilities.
- **Processing Performed:** Applies Order Crossover (OX) to preserve tour sequences, swap/inversion mutations to introduce diversity, and elitist tournament selection across generations.
- **Output:** Candidate multi-vehicle route solution.
- **Connections:**
  - Dispatched from `DAA optimization engine`.
  - Transmits result to `Route evaluator & constraint checks` via `candidate solution`.

#### 19. Hybrid optimizer - GA + 2-Opt
- **Component Name:** `Hybrid optimizer - GA + 2-Opt`
- **Purpose:** High-performance memetic algorithm for large, high-complexity problem instances (score $\ge 75$ and orders $\ge 25$).
- **Input:** Order set, fleet parameters, distance matrix, and execution time budget.
- **Processing Performed:** Combines global exploration and local exploitation: 80% of computation time is dedicated to Genetic Algorithm global search, and 20% is allocated to 2-Opt local refinement on top individuals.
- **Output:** Candidate multi-vehicle route solution.
- **Connections:**
  - Dispatched from `DAA optimization engine`.
  - Transmits result to `Route evaluator & constraint checks` via `candidate solution`.

#### 20. Route evaluator & constraint checks
- **Component Name:** `Route evaluator & constraint checks`
- **Purpose:** Centralized validation and objective function evaluation engine.
- **Input:** Candidate multi-vehicle route solutions from any of the four solvers.
- **Processing Performed:** Calculates cumulative travel distance, travel duration, service time at stops, and applies heavy weighted penalty functions for any constraint violations.
- **Output:** Feasibility assessment, total cost metric, and validated route plan.
- **Connections:**
  - Receives `candidate solution` from `Greedy nearest neighbor`.
  - Receives `candidate solution` from `Local search - 2-Opt & relocation`.
  - Receives `candidate solution` from `Genetic algorithm - Order Crossover`.
  - Receives `candidate solution` from `Hybrid optimizer - GA + 2-Opt`.
  - Directs check to `Vehicle capacity limit check` via `validate capacity`.
  - Directs check to `Time window & lateness check` via `validate arrival vs end`.
  - Directs check to `Zero unassigned & duplicate check` via `order coverage`.

#### 21. Vehicle capacity limit check
- **Component Name:** `Vehicle capacity limit check`
- **Purpose:** Verifies that no vehicle carries package weight exceeding its certified maximum payload.
- **Input:** Cumulative order demands per assigned vehicle route.
- **Processing Performed:** Computes $\sum \text{weight}_i \le \text{Capacity}_{\text{max}}$. Violations incur a high penalty ($1000\times$).
- **Output:** Pass/fail boolean flag and overload magnitude.
- **Connections:** Evaluated by `Route evaluator & constraint checks` via `validate capacity`.

#### 22. Time window & lateness check
- **Component Name:** `Time window & lateness check`
- **Purpose:** Assesses arrival times against customer-specified delivery time windows $[e_i, l_i]$.
- **Input:** Cumulative route arrival times, service durations (5 minutes per stop), and delivery windows.
- **Processing Performed:** If arrival $t < e_i$, vehicle waits. If $t > l_i$, a lateness penalty ($50\times \text{minutes late}$) is added to the objective score.
- **Output:** Lateness penalty and schedule feasibility status.
- **Connections:** Evaluated by `Route evaluator & constraint checks` via `validate arrival vs end`.

#### 23. Zero unassigned & duplicate check
- **Component Name:** `Zero unassigned & duplicate check`
- **Purpose:** Enforces complete order coverage and single-visit delivery integrity.
- **Input:** Complete set of assigned stop identifiers across all active vehicle routes.
- **Processing Performed:** Asserts that every order appears in the solution exactly once: $|\bigcup \text{stops}| = N$ and $\text{stops}_j \cap \text{stops}_k = \emptyset$. Unassigned orders incur an extreme penalty ($5000\times$).
- **Output:** Coverage validation status.
- **Connections:** Evaluated by `Route evaluator & constraint checks` via `order coverage`.

#### 24. Routing & distance service
- **Component Name:** `Routing & distance service`
- **Purpose:** Spatial calculation orchestrator managing road network metrics, travel durations, and turn-by-turn road polylines.
- **Input:** Geographic coordinates of depots and delivery stops.
- **Processing Performed:** Selects between instant matrix computation and street routing, and coordinates caching.
- **Output:** $N \times N$ distance/duration matrices and GeoJSON polyline geometries.
- **Connections:**
  - Invoked by `FastAPI backend` via `driving road geometry`.
  - Queries `Haversine 1.3x matrix builder` via `sub-millisecond matrix`.
  - Queries `OSRM routing engine` via `turn-by-turn road polyline`.
  - Interacts with `routing_cache table` via `cached road segments`.

#### 25. Haversine 1.3x matrix builder
- **Component Name:** `Haversine 1.3x matrix builder`
- **Purpose:** High-speed internal distance matrix generator operating in sub-millisecond execution time.
- **Input:** List of coordinate pairs $[(\text{lat}_1, \text{lon}_1), \dots, (\text{lat}_N, \text{lon}_N)]$.
- **Processing Performed:** Calculates great-circle geodesic distances between all point pairs and scales them by a $1.3\times$ empirical urban road tortuosity/curvature factor. Computes estimated travel times using urban speed models (e.g., $25\text{ km/h}$).
- **Output:** Complete $N \times N$ float matrix.
- **Connections:** Invoked by `Routing & distance service` via `sub-millisecond matrix`.

#### 26. OSRM routing engine
- **Component Name:** `OSRM routing engine`
- **Purpose:** Local client adapter communicating with the Open Source Routing Machine protocol.
- **Input:** Ordered sequence of stop coordinates for optimized vehicle routes.
- **Processing Performed:** Formulates HTTP routing requests, parses GeoJSON polylines, and extracts street-by-street navigation maneuvers.
- **Output:** Turn-by-turn road polyline coordinates.
- **Connections:**
  - Invoked by `Routing & distance service` via `turn-by-turn road polyline`.
  - Dispatches calls to `External OSRM public API` via `HTTP GET /route/v1/driving`.

#### 27. External OSRM public API
- **Component Name:** `External OSRM public API` (External Service)
- **Purpose:** Publicly hosted Open Source Routing Machine instance (`router.project-osrm.org`).
- **Input:** HTTP GET requests encoding coordinate waypoints.
- **Processing Performed:** Graph traversal over real OpenStreetMap road networks.
- **Output:** HTTP 200 responses with geometry polylines and leg durations.
- **Connections:** Queried by `OSRM routing engine` via `HTTP GET /route/v1/driving`.

#### 28. routing_cache table
- **Component Name:** `routing_cache table` (Cylindrical Data Store)
- **Purpose:** Database table caching resolved street distance and polyline geometries to eliminate redundant external API requests.
- **Input:** Origin-destination coordinate hashes and polyline payloads.
- **Processing Performed:** Hash-based indexing of road segments.
- **Output:** Cached polyline strings and distance floats.
- **Connections:** Accessed by `Routing & distance service` via `cached road segments`.

#### 29. Asyncio simulation engine
- **Component Name:** `Asyncio simulation engine`
- **Purpose:** Asynchronous event-loop process simulating physical vehicle dispatch and route traversal.
- **Input:** Execution command from `FastAPI backend` and finalized vehicle route polylines.
- **Processing Performed:** Manages an async timer loop that steps simulated vehicles along road segments, computes speed variations, and handles delivery stop dwell times.
- **Output:** Telemetry trigger signals and status transitions (`IN_TRANSIT`, `DELIVERED`).
- **Connections:**
  - Spawned by `FastAPI backend` via `background loop`.
  - Drives `Live GPS telemetry generator` via `segment interpolation`.

#### 30. Live GPS telemetry generator
- **Component Name:** `Live GPS telemetry generator`
- **Purpose:** Real-time spatial interpolation module computing instantaneous vehicle coordinates.
- **Input:** Road polyline vertex arrays and elapsed simulation time deltas.
- **Processing Performed:** Performs linear segment interpolation along polyline coordinates, calculates heading angles and velocities, and records delivery arrivals.
- **Output:** GPS telemetry frames containing vehicle ID, current latitude, current longitude, speed, heading, and battery/cargo status.
- **Connections:**
  - Receives interpolated steps from `Asyncio simulation engine` via `segment interpolation`.
  - Pushes real-time frames to `WebSocket connection manager` via `broadcast position`.
  - Writes audit logs to `vehicle_locations table` via `persist location audit`.

#### 31. WebSocket connection manager
- **Component Name:** `WebSocket connection manager`
- **Purpose:** In-memory connection pool managing active client WebSocket connections.
- **Input:** Telemetry frames from `Live GPS telemetry generator` and client socket connections.
- **Processing Performed:** Serializes telemetry frames to JSON and broadcasts them concurrently to all subscribed frontend clients over the `/ws/live` channel.
- **Output:** High-frequency live telemetry push messages.
- **Connections:**
  - Receives coordinates from `Live GPS telemetry generator` via `broadcast position`.
  - Transmits to `React + Vite frontend` via `live vehicle coords`.

#### 32. vehicle_locations table
- **Component Name:** `vehicle_locations table` (Cylindrical Data Store)
- **Purpose:** Relational table providing an audit trail of historical vehicle coordinates.
- **Input:** GPS telemetry records with timestamp, vehicle ID, latitude, longitude, and speed.
- **Processing Performed:** Append-only database insertion.
- **Output:** Historical vehicle movement trails for audit and playback.
- **Connections:** Written to by `Live GPS telemetry generator` via `persist location audit`.

#### 33. SQLite database delivery.db
- **Component Name:** `SQLite database delivery.db` (Cylindrical Data Store)
- **Purpose:** Central relational database engine storing all persistent domain models, configuration states, and operational results.
- **Input:** SQL transactions orchestrated via SQLAlchemy ORM.
- **Processing Performed:** Enforces schema constraints, foreign key relationships, and ACID transaction boundaries.
- **Output:** Persisted domain entities and query results.
- **Connections:**
  - Controlled by `FastAPI backend` via `SQLAlchemy ORM`.
  - Hosts `orders table`.
  - Hosts `vehicles table`.
  - Hosts `routes & route_stops`.
  - Hosts `optimization_runs & metrics`.
  - Hosts `model_versions table`.

#### 34. orders table
- **Component Name:** `orders table` (Cylindrical Data Store)
- **Purpose:** Stores customer order records, delivery locations, parcel weights, time windows, and geocoding status.
- **Connections:** Entity within `SQLite database delivery.db`.

#### 35. vehicles table
- **Component Name:** `vehicles table` (Cylindrical Data Store)
- **Purpose:** Stores fleet vehicle records, maximum weight capacities, operational status, and depot assignments.
- **Connections:** Entity within `SQLite database delivery.db`.

#### 36. routes & route_stops
- **Component Name:** `routes & route_stops` (Cylindrical Data Store)
- **Purpose:** Stores generated delivery routes, total distances, durations, stop sequences, and arrival ETAs.
- **Connections:** Entity within `SQLite database delivery.db`.

#### 37. optimization_runs & metrics
- **Component Name:** `optimization_runs & metrics` (Cylindrical Data Store)
- **Purpose:** Stores optimization run history, complexity scores, algorithm selection, execution latency, and percentage improvements.
- **Connections:** Entity within `SQLite database delivery.db`.

#### 38. model_versions table
- **Component Name:** `model_versions table` (Cylindrical Data Store)
- **Purpose:** Stores metadata for trained ML models, accuracy scores, confusion matrix metrics, and feature importances.
- **Connections:** Entity within `SQLite database delivery.db`.

---

### D. Data Flow

The complete end-to-end processing sequence follows seven structured stages:

```
[User / CSV] ──(1)──> [React Frontend] ──(2)──> [FastAPI Backend] ──(3)──> [Geocoding Router]
                                                                                │
                                                                   [Complexity Builder]
                                                                                │
                                                                   [ML Strategy Classifier]
                                                                                │
                                                                   [Safety Arbiter]
                                                                                │
[Frontend Map] <──(7)── [WebSocket Stream] <──(6)── [Simulation] <──(5)── [DAA Engine & Solvers]
                                                                                │
                                                                       [Route Evaluator]
                                                                                │
                                                                    (4) [SQLite delivery.db]
```

#### Stage 1: Order Ingestion & Client Configuration
1. The user uploads a customer orders CSV file or configures delivery parameters on the `React + Vite frontend`.
2. The frontend saves user filters and view history in `Browser localStorage`.
3. The frontend sends an HTTP `POST /api/orders/import` request with the CSV payload to the `FastAPI backend`.

#### Stage 2: Ingestion, Validation & Geocoding
1. The `FastAPI backend` parses the order records and triggers the `Geocoding router`.
2. For each address, the router checks the `Local Pune dictionary - 40+ areas` for a localized string match.
3. If not found, it checks the `Pune PIN code map - 25+ PINs`.
4. If still unresolved, it issues an HTTP query to the `Nominatim OSM API`.
5. If the address cannot be geocoded, it enters `Strict validation - status FAILED`, ensuring that invalid coordinates never enter the optimization engine.
6. Successfully geocoded orders are stored in the `orders table` of `SQLite database delivery.db` using SQLAlchemy.

#### Stage 3: Complexity Analysis & Algorithmic Strategy Selection
1. The user triggers route planning via `POST /api/optimization/run`.
2. The `FastAPI backend` passes the scenario data to the `Complexity feature builder`, which extracts 8 normalized operational metrics.
3. The normalized feature vector is delivered to the `ML strategy classifier`.
4. If `Random Forest - model.joblib 85%` is available, it predicts the most cost-effective algorithm class. If uninitialized, the system falls back to `Deterministic heuristics`.
5. The `Safety & feasibility arbiter` applies boundary checks:
   - If orders $\le 6$, it forces `Greedy nearest neighbor`.
   - If complexity score $\ge 75$ and orders $\ge 25$, it selects `Hybrid optimizer - GA + 2-Opt`.
6. The selected strategy is dispatched to the `DAA optimization engine`.

#### Stage 4: Distance Matrix Construction & Algorithmic Optimization
1. In parallel with strategy arbitration, the `Routing & distance service` invokes the `Haversine 1.3x matrix builder` to generate an $N \times N$ distance and travel time matrix in sub-millisecond execution time.
2. The `DAA optimization engine` executes the selected solver:
   - `Greedy nearest neighbor` for small/low-complexity instances.
   - `Local search - 2-Opt & relocation` for moderate-complexity instances.
   - `Genetic algorithm - Order Crossover` for high-complexity combinatorial scenarios.
   - `Hybrid optimizer - GA + 2-Opt` for large, heavily constrained scenarios.
3. The solver yields candidate multi-vehicle route solutions.

#### Stage 5: Route Evaluation & Feasibility Constraint Validation
1. The candidate solutions are passed to the `Route evaluator & constraint checks`.
2. The evaluator evaluates three critical constraint dimensions:
   - `Vehicle capacity limit check`: verifies package weights do not exceed vehicle capacity.
   - `Time window & lateness check`: validates arrival times and calculates lateness penalties.
   - `Zero unassigned & duplicate check`: confirms that all valid orders are assigned exactly once.
3. The optimal, feasible route solution is saved in the `routes & route_stops` table, and execution metrics are recorded in `optimization_runs & metrics`.
4. A structured JSON result is returned to the `React + Vite frontend`.

#### Stage 6: Polyline Generation & Real-Time Fleet Simulation
1. When the user starts simulation (`POST /api/simulation/start`), the `Routing & distance service` calls the `OSRM routing engine` to obtain turn-by-turn road polylines from the `External OSRM public API` (or loads them from the `routing_cache table`).
2. The `Asyncio simulation engine` starts an asynchronous background event loop that traverses the route polylines.
3. The `Live GPS telemetry generator` interpolates vehicle coordinates along polyline segments.
4. Each interpolated position is:
   - Persisted to the `vehicle_locations table` for audit and playback.
   - Forwarded to the `WebSocket connection manager`.

#### Stage 7: Telemetry Broadcasting & Live Client Visualization
1. The `WebSocket connection manager` broadcasts live vehicle coordinates over the `/ws/live` stream.
2. The `React + Vite frontend` receives the stream and updates vehicle marker positions and delivery progress on the interactive Leaflet map.

---

### E. Database Architecture

The system uses both client-side storage and an ACID-compliant relational SQLite database (`delivery.db`) managed via SQLAlchemy 2.0 ORM. The diagram shows eleven specific persistent entities:

```
[Browser localStorage]  (Client-side session and UI state)
[Local Pune dictionary]  (Static lookup table for 40+ Pune localities)
[Pune PIN code map]      (Static lookup table for 25+ postal PINs)
[model.joblib 85%]       (Serialized Random Forest classifier file)
[routing_cache table]    (Persistent cache for road distance & GeoJSON polylines)
[vehicle_locations table] (Historical GPS telemetry audit logs)

[SQLite database delivery.db]
  ├── [orders table]
  ├── [vehicles table]
  ├── [routes & route_stops]
  ├── [optimization_runs & metrics]
  └── [model_versions table]
```

1. **`Browser localStorage`:** Key-value store in the user's browser runtime; caches active UI filter preferences, map layers, and dispatch history.
2. **`Local Pune dictionary - 40+ areas`:** In-memory/static key-value table containing verified coordinates for 40+ Pune localities.
3. **`Pune PIN code map - 25+ PINs`:** Static mapping table connecting 25+ postal PIN codes (`411001` to `412207`) to geographic centroids.
4. **`Random Forest - model.joblib 85%`:** Serialized binary artifact storing the trained scikit-learn classifier weights and hyperparameters.
5. **`routing_cache table`:** Caches calculated driving distances, durations, and GeoJSON polyline strings keyed by coordinate pair hashes to prevent redundant network calls.
6. **`vehicle_locations table`:** Audit table recording time-series telemetry data (timestamp, vehicle ID, latitude, longitude, speed, status).
7. **`SQLite database delivery.db`:** The primary relational database containing:
   - **`orders table`:** Stores order IDs, customer names, delivery addresses, coordinates, package weights, time windows ($[e_i, l_i]$), priority levels, and geocoding status flags (`GEOCODED`, `FAILED`).
   - **`vehicles table`:** Stores vehicle IDs, fleet names, maximum weight capacities, current load allocations, and operational status (`IDLE`, `IN_TRANSIT`, `MAINTENANCE`).
   - **`routes & route_stops`:** Stores route header records (assigned vehicle, total distance, total duration) and ordered stop records (sequence number, order ID, planned arrival time, departure time, lateness).
   - **`optimization_runs & metrics`:** Audit logs recording run timestamps, order counts, vehicle counts, complexity scores, selected algorithm, solve time (ms), total route distance, and percentage improvement.
   - **`model_versions table`:** Model governance table logging model IDs, training timestamps, accuracy scores (85.0%), confusion matrix metrics, and feature importance rankings.

---

### F. Algorithm and Optimization Pipeline

The optimization pipeline balances computational latency and solution quality through a four-stage process:

```
[Problem Instance]
        │
        ▼
[Complexity Feature Builder] ──(8 Features)──> [ML Classifier / Random Forest]
                                                          │
                                                 [Safety Arbiter]
                                                          │
                    ┌─────────────────┬───────────────────┼────────────────────┐
                    ▼                 ▼                   ▼                    ▼
             [Greedy Nearest    [Local Search:    [Genetic Algorithm:  [Hybrid Optimizer:
                Neighbor]      2-Opt & Relocate]    Order Crossover]     GA + 2-Opt]
                    │                 │                   │                    │
                    └─────────────────┴─────────┬─────────┴────────────────────┘
                                                ▼
                              [Route Evaluator & Constraint Checks]
                                 ├── Capacity Limit Check
                                 ├── Time Window & Lateness Check
                                 └── Zero Unassigned / Duplicate Check
```

#### 1. Feature Extraction & Strategy Selection
- The `Complexity feature builder` distills the scenario into 8 normalized operational metrics.
- The `ML strategy classifier` evaluates the pre-trained Random Forest model (`model.joblib`) to predict the best algorithm.
- The `Safety & feasibility arbiter` ensures operational safety:
  - If $\text{orders} \le 6$ or complexity is low: dispatches **Greedy nearest neighbor**.
  - If complexity is moderate: dispatches **Local search - 2-Opt & relocation**.
  - If complexity is high: dispatches **Genetic algorithm - Order Crossover**.
  - If $\text{complexity score} \ge 75$ and $\text{orders} \ge 25$: upgrades to **Hybrid optimizer - GA + 2-Opt**.

#### 2. Solver Implementations
- **Greedy Nearest Neighbor:** An $O(N^2)$ heuristic that constructs routes by repeatedly visiting the closest feasible stop. Includes priority multipliers:
  $$\text{effective\_distance} = \text{distance} \times \text{priority\_multiplier}$$
  where `URGENT` $= 0.7\times$, `HIGH` $= 0.85\times$, `NORMAL` $= 1.0\times$, `LOW` $= 1.15\times$.
- **Local Search (2-Opt & Relocation):** Starts from an initial tour and iteratively evaluates all 2-Opt edge swaps within a route to uncross paths, combined with order relocation between routes until no improving move can be found.
- **Genetic Algorithm (Order Crossover):** Maintains a population of candidate solutions. Uses Order Crossover (OX) to produce valid permutations without duplicate stops, swap and inversion mutations to maintain diversity, and elitist selection across generations.
- **Hybrid Optimizer (Memetic Algorithm):** Combines the global exploration of the Genetic Algorithm (80% of computation time) with the local exploitation of 2-Opt search (20% of computation time) applied to the top candidates.

#### 3. Route Evaluation & Feasibility Validation
Every candidate solution must pass through the `Route evaluator & constraint checks`, which calculates the comprehensive objective cost:

$$\text{Objective Cost} = \text{Total Distance} + \text{Capacity Penalty} + \text{Lateness Penalty} + \text{Coverage Penalty}$$

---

### G. External Integrations

The system integrates with two external services:

| External Service | Interface & Protocol | Direction | Fallback Mechanism |
|---|---|---|---|
| **Nominatim OSM API** | HTTP GET forward geocoding query | Outgoing from `Geocoding router` to remote OSM service | If external query fails or times out, the address transitions to `Strict validation - status FAILED`. Local matches and PIN matches take precedence. |
| **External OSRM public API** | HTTP GET `/route/v1/driving` | Outgoing from `OSRM routing engine` to `router.project-osrm.org` | Results are cached in the `routing_cache table`. For distance and duration matrix generation, the system uses the internal `Haversine 1.3x matrix builder` to avoid external dependencies. |

---

### H. Validation and Constraints

The system applies validation checks across three stages:

1. **Geocoding Validation (`Strict validation - status FAILED`):**
   - Addresses that cannot be matched against local dictionaries, PIN code maps, or the external Nominatim API are flagged as `FAILED`.
   - The system refuses to fabricate arbitrary coordinates. Unresolved orders are excluded from the optimization run.

2. **Vehicle Capacity Limit Check:**
   - Evaluates that total parcel weight on any vehicle route does not exceed that vehicle's certified maximum payload:
     $$\sum_{i \in \text{Route}_k} \text{weight}_i \le \text{Capacity}_k$$
   - Any capacity violation incurs a $1000\times$ penalty per kilogram over capacity.

3. **Time Window & Lateness Check:**
   - Evaluates arrival times against customer delivery windows $[e_i, l_i]$.
   - Includes a standard 5-minute service dwell time per stop.
   - Early arrivals wait until $e_i$. Late arrivals ($t > l_i$) incur a penalty of $50\times$ per minute of delay.

4. **Zero Unassigned & Duplicate Check:**
   - Verifies complete order coverage: every order must be visited exactly once.
   - Unassigned orders incur an extreme penalty ($5000\times$ per missed order).
   - Duplicate visits are strictly forbidden.

---

### I. Assumptions and Unclear Components

To maintain technical accuracy, this section separates elements directly verified in the reference image from architectural interpretations:

#### 1. Verified from Reference Image (100% Match)
- Every node name, cylinder shape, and connecting edge label matches the reference image:
  - `User: orders CSV or config`
  - `React + Vite frontend`
  - `Browser localStorage`
  - `FastAPI backend`
  - `Geocoding router`
  - `Local Pune dictionary - 40+ areas`
  - `Pune PIN code map - 25+ PINs`
  - `Nominatim OSM API`
  - `Strict validation - status FAILED`
  - `Complexity feature builder`
  - `ML strategy classifier`
  - `Random Forest - model.joblib 85%`
  - `Deterministic heuristics`
  - `Safety & feasibility arbiter`
  - `DAA optimization engine`
  - `Greedy nearest neighbor`
  - `Local search - 2-Opt & relocation`
  - `Genetic algorithm - Order Crossover`
  - `Hybrid optimizer - GA + 2-Opt`
  - `Route evaluator & constraint checks`
  - `Vehicle capacity limit check`
  - `Time window & lateness check`
  - `Zero unassigned & duplicate check`
  - `Routing & distance service`
  - `Haversine 1.3x matrix builder`
  - `OSRM routing engine`
  - `External OSRM public API`
  - `routing_cache table`
  - `Asyncio simulation engine`
  - `Live GPS telemetry generator`
  - `WebSocket connection manager`
  - `vehicle_locations table`
  - `SQLite database delivery.db`
  - `orders table`
  - `vehicles table`
  - `routes & route_stops`
  - `optimization_runs & metrics`
  - `model_versions table`
- All 46 connecting labels and directional arrows match the reference image.
- Visual styling (dark background `#0e1117`, dark slate nodes `#161920`, blue highlight nodes `#1a2332`, red warning node `#2d1519`, purple database cylinders `#1c212d`) reproduces the original aesthetic.

#### 2. Architectural Interpretations & Contextual Details
- **8 Features in Complexity Builder:** While the diagram labels the arrow as `extract 8 features`, the specific 8 feature names (`order_count`, `vehicle_count`, `geographic_spread`, `capacity_utilization`, `time_window_tightness`, `constraint_density`, `spatial_clustering`, `demand_variance`) are derived from the accompanying project codebase.
- **Penalty Multipliers:** The specific penalty weights ($1000\times$ for capacity, $50\times$ for lateness, $5000\times$ for unassigned) and priority multipliers ($0.7\times$, $0.85\times$, $1.0\times$, $1.15\times$) are corroborated by the backend optimization evaluator implementation.
- **Unclear / Ambiguous Labels:** None. Every node and label in the reference diagram has been fully identified and transcribed without placeholder markers.

---

## 4. Architectural Verification Matrix

| Component Group | Components Identified in Diagram | Status | Notes |
|---|---|---|---|
| **Presentation & Client** | User, React + Vite frontend, Browser localStorage | Verified | Includes UI cache and REST / WebSocket interfaces. |
| **Backend & Ingestion** | FastAPI backend, POST endpoints, JSON responses | Verified | Central controller for all subsystems. |
| **Geocoding & Resolution** | Geocoding router, Local Pune dictionary, Pune PIN map, Nominatim OSM API, Strict validation | Verified | Multi-tiered fallback with strict failure mode. |
| **Complexity & ML** | Complexity feature builder, ML strategy classifier, Random Forest 85%, Deterministic heuristics, Safety arbiter | Verified | Combines offline ML model with deterministic guardrails. |
| **Optimization Solvers** | DAA engine, Greedy, Local Search (2-Opt), Genetic Algorithm (OX), Hybrid (GA + 2-Opt) | Verified | Covers the full spectrum from $O(N^2)$ to memetic metaheuristics. |
| **Evaluation & Constraints** | Route evaluator, Capacity check, Time window check, Zero unassigned / duplicate check | Verified | Applies weighted objective penalties. |
| **Routing & Polyline** | Routing service, Haversine 1.3x matrix builder, OSRM routing engine, External OSRM API, routing_cache table | Verified | Combines fast internal matrix generation with street-level routing. |
| **Simulation & Telemetry** | Asyncio simulation engine, Live GPS generator, WebSocket manager, vehicle_locations table | Verified | Asynchronous background loop streaming over WebSockets. |
| **Persistence Layer** | SQLite database delivery.db, orders, vehicles, routes & route_stops, optimization_runs & metrics, model_versions | Verified | Managed via SQLAlchemy ORM. |
