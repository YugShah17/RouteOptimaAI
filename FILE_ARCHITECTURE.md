# RouteOptimaAI — Codebase File Architecture

> Complete reference guide for the directory structure, file-by-file responsibilities, and cross-layer call graphs of the **RouteOptimaAI** project.

The detailed, full-length file architecture document is available at:
👉 **[`docs/file-architecture.md`](docs/file-architecture.md)**

---

## Quick Directory Map

```
RouteOptimaAI/
├── backend/                  # Python FastAPI Backend, ML Pipeline, & Optimization Engine
│   ├── app/                  # Application Core
│   │   ├── api/              # REST API route controllers (routes_api.py - 32 endpoints)
│   │   ├── models/           # SQLAlchemy ORM entities (entities.py - 11 tables)
│   │   ├── optimization/     # DAA solvers (greedy.py, local_search.py, genetic.py, hybrid.py, evaluator.py)
│   │   ├── schemas/          # Pydantic V2 request & response validation schemas
│   │   ├── services/         # Business logic (complexity, geocoding, ml_service, routing, simulation, websocket)
│   │   ├── config.py         # Global settings & environment variables
│   │   ├── database.py       # SQLAlchemy engine, session maker, & migration runners
│   │   └── main.py           # FastAPI entrypoint, middleware, & WebSocket lifecycle
│   ├── experiments/          # Benchmarking scripts (run_benchmark.py)
│   ├── ml/                   # ML dataset generator, training script, & model.joblib (85% accuracy)
│   ├── requirements.txt      # Python dependencies
│   └── seed.py               # Demo database seeder
│
├── frontend/                 # React 19 Single Page Application (SPA)
│   ├── public/               # Static icons & assets
│   ├── src/                  # Source code
│   │   ├── components/       # DeliveryMap.jsx (Interactive Leaflet 1.9.4 map)
│   │   ├── pages/            # 10 View Pages (Dashboard, Orders, Optimization, Tracking, ML, etc.)
│   │   ├── services/         # api.js (REST fetch client & WebSocket client)
│   │   ├── App.jsx           # Root layout & tab router
│   │   └── index.css         # Dark theme design system & styling
│   ├── package.json          # Node dependencies (React 19, Leaflet, Lucide)
│   └── vite.config.js        # Vite build tool config
│
├── data/                     # CSV datasets (sample orders, training data, benchmark logs)
├── docs/                     # Documentation suite, architecture diagrams (SVG/PNG/MMD), & guides
├── tests/                    # Pytest test suite (API, algorithms, geocoding, complexity)
├── delivery.db               # SQLite database file
└── README.md                 # Project README
```

For the comprehensive file-by-file breakdown, exported functions, and cross-layer dependency graphs, see:
**[docs/file-architecture.md](docs/file-architecture.md)**
