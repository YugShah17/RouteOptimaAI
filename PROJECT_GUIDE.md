# RouteOptimaAI - Project Guide

This guide is for running the project quickly and for explaining how the work
was split across a **team of 3** for the DAA submission. For the full technical
write-up see [`README.md`](README.md) and the files in [`docs/`](docs/).

---

## 1. What you need

- Python 3.10 or newer
- Node.js 18 or newer (for the dashboard)
- Internet access (optional - only for OSRM road routes and Nominatim geocoding;
  the app falls back to straight-line estimates when offline)

---

## 2. How to use (quick start)

### Backend (API + optimizer + ML)

```bash
python -m pip install -r backend/requirements.txt

# Train the ML strategy classifier (also generates the dataset if missing)
python -m backend.ml.train

# Load demo Pune data (orders, vehicles, depot)
python -m backend.seed

# Start the API
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger API docs: http://localhost:8000/docs
- Live WebSocket: `ws://localhost:8000/ws/live`

### Frontend (React dashboard)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Tests

```bash
python -m pytest -q
```

### Benchmark (optional)

```bash
python -m backend.experiments.run_benchmark
```

---

## 3. Using the app in 6 steps

1. **Dashboard** - see fleet, pending orders, and utilization.
2. **Orders -> Create / Import** - add an address (auto-geocoded) or upload the CSV template.
3. **Optimization -> Re-Analyze** - read the complexity score and the ML strategy recommendation.
4. **Run Optimization** - inspect the before/after distance comparison and the routes on the map.
5. **Live Simulation** - start the fleet simulation and watch vehicles move via WebSocket.
6. **ML Model** - view accuracy, F1, and feature importances.

---

## 4. Configuration

Copy `.env.example` to `.env` and edit as needed.

| Variable | Purpose | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Database connection | `sqlite:///./delivery.db` |
| `ROUTING_PROVIDER` | `osrm` or fallback | `osrm` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `*` (dev only) |
| `SIMULATION_API_KEY` | Protects telemetry/simulation routes | dev key |
| `VITE_API_BASE_URL` | Frontend -> backend REST URL | `http://localhost:8000/api` |
| `VITE_WS_BASE_URL` | Frontend -> backend WebSocket URL | `ws://localhost:8000/ws/live` |

On the frontend, the same values can be placed in `frontend/.env` to point at a
remote backend.

---

## 5. How the work was split across 3 people

We are a 3-member team. Everyone touched the whole system, but each person
owned one layer end-to-end so there were never two people editing the same
file at once.

| Member | Role | Owned files / work |
| :--- | :--- | :--- |
| **Person 1** | Algorithms & Optimization | `backend/app/optimization/*` (greedy, local search, genetic, hybrid, evaluator), complexity analysis (`services/complexity.py`), and the DAA complexity write-up (`docs/optimization.md`) |
| **Person 2** | Backend, ML & Data | FastAPI routes (`api/routes_api.py`), database models, ML pipeline (`ml/train.py`, `ml/dataset_generator.py`, `services/ml_service.py`), routing/geocoding/simulation services, seeding |
| **Person 3** | Frontend, Testing & Docs | React dashboard (`frontend/src/*`), the API client, Leaflet maps, test suite (`tests/*`), benchmark runner, and documentation (`README.md`, this guide, `docs/`) |

### What the DAA angle was for each person

- **Person 1** handled the core algorithm design and the Big-O / empirical
  runtime comparison (Greedy `O(K·N²)`, 2-opt, Genetic `O(G·P·N)`).
- **Person 2** handled the ML classifier that selects which algorithm to run,
  plus the data model and API layer.
- **Person 3** handled visualization, reproducibility (tests + benchmark), and
  the report.

### Phases and timeline

| Phase | Weeks | What happened |
| :--- | :--- | :--- |
| 1. Design | 1 | Agreed on the CVRPTW formulation, shared data shapes, and API contract |
| 2. Build | 2-3 | Each member built their layer in parallel against the agreed contract |
| 3. Integrate | 4 | Wired the layers, fixed interfaces, trained the model |
| 4. Validate | 5 | Ran tests and benchmarks, wrote the report, prepared the demo |

### How we actually worked together

- One branch per feature, one reviewer per pull request (the other two members).
- The `OptimizationRunRequest` / `OptimizationRunResponse` schemas were frozen
  first so all three could work independently.
- Daily 10-minute sync to unblock each other.
- Final integration and the demo were done together.

---

## 6. Submission checklist

- [ ] `python -m pytest -q` passes
- [ ] `npm run build` succeeds in `frontend/`
- [ ] Model trained (`backend/ml/model.joblib`) and demo data seeded
- [ ] `docs/optimization.md` updated with the latest benchmark table
- [ ] `.env` is **not** committed (only `.env.example`)
