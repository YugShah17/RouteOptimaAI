# AI-Based Complexity-Aware Delivery Route Optimization System

A production-style last-mile logistics decision-support and dispatch system that utilizes **local Machine Learning to estimate routing problem complexity** and dynamically select the optimal optimization algorithm (**Greedy Nearest Neighbor, 2-Opt Local Search, Genetic Metaheuristic, or Hybrid**) for multi-vehicle fleets with capacity and delivery time window constraints.

---

## 🌟 Core Research Contribution

> **Rather than relying on a single static algorithm, routing complexity is dynamically assessed. Different problem instances exhibit distinct trade-offs between solution quality and computational runtime. An explainable scikit-learn Machine Learning classifier recommends the most suitable optimization strategy based on spatial spread, fleet capacity tightness, and constraint density, while a safety layer enforces hard physical feasibility.**

---

## 🚀 Key Features

1. **Complexity-Aware Optimization Engine:**
   - **Greedy / Nearest Neighbor:** Instantaneous $O(N^2)$ heuristic for simple problems.
   - **Local Search (2-Opt & Order Relocation):** Iteratively eliminates crossed links and reallocates orders across vehicles.
   - **Genetic Algorithm:** Population-based global metaheuristic using Order Crossover (OX), swap/inversion mutations, and tournament selection with elitism.
   - **Hybrid Genetic + Local Search:** Combines global metaheuristic exploration with local 2-opt fine-tuning.

2. **Machine Learning Strategy Classifier:**
   - Trained on 500 simulated scenarios evaluated against candidate algorithms.
   - **85.00% accuracy** and **82.54% weighted F1 score** via Random Forest.
   - Computes feature importances and human-readable explainability logs.
   - **No external LLM / OpenAI API dependencies** — 100% local and reproducible.

3. **Multi-Vehicle Capacitated Routing (CVRPTW):**
   - Vehicle payload limits and capacity enforcement.
   - Priority delivery tiers: `LOW`, `NORMAL`, `HIGH`, `URGENT`.
   - Time window constraints with arrival time estimation and late penalty functions.

4. **Open Routing & Spatial Fallback:**
   - Real-world coordinates centered around **Pune, Maharashtra, India**.
   - **OpenStreetMap Nominatim** forward geocoding.
   - **OSRM (Open Source Routing Machine)** road routing with polyline road geometries.
   - Automated **straight-line distance fallback** (labeled explicitly) with distance matrix caching in the database.

5. **Live Vehicle Simulation Mode & Real GPS Telemetry:**
   - Vehicle movement simulator traverses routes stop-by-stop in real time.
   - Bi-directional **WebSocket stream (`/ws/live`)** updating vehicle coordinates, speed, load, and marking deliveries as completed.
   - Dedicated REST endpoint (`POST /api/vehicles/{id}/location`) ready for physical IoT GPS trackers.

6. **Interactive Logistics Dashboard & Leaflet Map:**
   - Multi-vehicle colored route lines, depot markers, customer sequence indicators, and popups.
   - Before vs After benchmark comparisons (Distance Saved, % Improvement, Runtime).
   - Order management with CSV bulk import and row-by-row validation.
   - Fleet capacity gauges, optimization audit history, and model diagnostics.

---

## 🛠️ Architecture & Tech Stack

```
React 19 + Leaflet + Vite (Frontend)
          ↓ (REST APIs + WebSocket)
FastAPI Monolith (Backend)
  ├── Problem Complexity Analysis Service
  ├── Scikit-Learn Random Forest Classifier
  ├── Algorithmic Solvers (Greedy, 2-Opt, Genetic, Hybrid)
  ├── OSRM & Nominatim Spatial Service + DB Matrix Cache
  └── Real-time Vehicle Simulation Engine
          ↓ (SQLAlchemy ORM)
SQLite (Local Dev) / PostgreSQL (Production)
```

- **Backend:** Python 3.10+, FastAPI, SQLAlchemy, Pydantic v2, scikit-learn, pandas, numpy, joblib, websockets.
- **Frontend:** React 19, Vite, Leaflet, React-Leaflet, Lucide Icons, Vanilla CSS design system.
- **Spatial:** Nominatim, OSRM, Haversine with road curvature modeling.

---

## 📋 Quick Setup & Run Instructions

### 1. Clone / Navigate to Directory
```bash
cd DAAA
```

### 2. Backend Setup
```bash
# Install dependencies
python -m pip install -r backend/requirements.txt

# Train the ML model (generates training dataset if not present)
python -m backend.ml.train

# Seed realistic demo data (Pune, India logistics fleet)
python -m backend.seed

# Start the FastAPI backend server
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- WebSocket stream: `ws://localhost:8000/ws/live`

### 3. Frontend Setup
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & Experimental Benchmarks

### Run Automated Unit & Integration Tests:
```bash
python -m pytest -v
```
*All 11 test suites pass covering Greedy, 2-Opt, Genetic, Evaluator, Complexity Analyzer, and API endpoints.*

### Run Benchmark Experiments:
```bash
python -m backend.experiments.run_benchmark
```
Runs performance comparisons across 10, 20, 50, and 80 order instances and saves metrics to `data/benchmark_results.csv`.

---

## 🚦 End-to-End Demonstration Walkthrough

1. **Dashboard:** Open the UI to view active fleet vehicles, pending orders, and utilization gauges.
2. **Order Management:** View existing orders, or go to **Create / Import** to geocode a new address in Pune or upload a CSV.
3. **Problem Analysis:** Navigate to **Optimization**, click **Re-Analyze Problem**.
   - Note the **Complexity Score** (0–100) and Level (`LOW`, `MEDIUM`, or `HIGH`).
   - Observe the **ML Strategy Recommendation** and its explainability reason.
4. **Execution:** Click **Run Optimization**.
   - Watch the animated progress stepper.
   - Review the **Before vs After Comparison** (e.g. 15%–25% distance saved, late delivery reductions).
   - View the generated multi-vehicle routes on the **Leaflet Map**.
5. **Live Simulation:** Click **Start Live Fleet Simulation** (or go to **Live Simulation**).
   - Watch vehicles move along their routes.
   - Telemetry speed, coordinates, and package loads update dynamically via WebSocket.
   - Deliveries transition to `DELIVERED` status as vehicles reach each customer.
6. **Audit History & ML Explainability:**
   - Inspect previous execution records in **Optimization History**.
   - Visit **ML Strategy Model** to review feature importances (number of orders, constraints, geographical spread).

---

## ⚙️ Environment Variables (`.env`)

```env
DATABASE_URL=sqlite:///./delivery.db
ROUTING_PROVIDER=osrm
OSRM_URL=https://router.project-osrm.org
NOMINATIM_URL=https://nominatim.openstreetmap.org
MAX_OPTIMIZATION_TIME=30
GENETIC_POPULATION_SIZE=50
GENETIC_GENERATIONS=80
SIMULATION_SPEED=1.0
HOST=0.0.0.0
PORT=8000
```

---

## 📚 Project Documentation

- [`docs/architecture.md`](file:///c:/Users/Pcm/OneDrive/Desktop/DAAA/docs/architecture.md) — System architecture, modular monolith design.
- [`docs/optimization.md`](file:///c:/Users/Pcm/OneDrive/Desktop/DAAA/docs/optimization.md) — Detailed DAA analysis, mathematical formulations, Big-O vs measured runtimes.
- [`docs/ml_pipeline.md`](file:///c:/Users/Pcm/OneDrive/Desktop/DAAA/docs/ml_pipeline.md) — Feature engineering, training methodology, evaluation metrics.
- [`docs/database.md`](file:///c:/Users/Pcm/OneDrive/Desktop/DAAA/docs/database.md) — Schema, entity relationships, and indexes.
- [`docs/api.md`](file:///c:/Users/Pcm/OneDrive/Desktop/DAAA/docs/api.md) — Complete REST endpoints and WebSocket protocols.
- [`docs/deployment.md`](file:///c:/Users/Pcm/OneDrive/Desktop/DAAA/docs/deployment.md) — Operations guide and optional Docker setup.

---

## 🛡️ Known Limitations & Future Improvements

- **Road Restrictions:** Current OSRM requests use driving mode; heavy vehicle bridge weight restrictions can be incorporated in future versions.
- **Dynamic Demand:** Future releases could implement dynamic mid-route re-optimization upon cancellation or urgent rush orders.
- **Production Persistence:** Can be switched effortlessly from SQLite to PostgreSQL by updating `DATABASE_URL` in `.env`.
