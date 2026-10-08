# Deployment & Local Operations Guide

## 1. Quick Local Execution

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ (Tested on Node.js 24)

### Step 1: Backend Setup
```bash
# From workspace root
python -m pip install -r backend/requirements.txt

# Run ML model training (generates dataset if missing)
python -m backend.ml.train

# Seed realistic logistics test data (Pune, Maharashtra)
python -m backend.seed

# Start FastAPI server
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI Swagger documentation will be available at: `http://localhost:8000/docs`

### Step 2: Frontend Setup
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```

Open the frontend dashboard in your browser: `http://localhost:5173`

---

## 2. Running Verification & Benchmarks

### Unit & Integration Test Suite
```bash
python -m pytest -v
```

### Run Experimental Benchmark Experiments
```bash
python -m backend.experiments.run_benchmark
```
Saves comparative benchmark results across Greedy, Local Search, Genetic, and Hybrid to `data/benchmark_results.csv`.

---

## 3. Optional Docker Deployment (`docker-compose.yml`)

The system can optionally run using containerized microservices:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./delivery.db
      - ROUTING_PROVIDER=osrm
      - OSRM_URL=https://router.project-osrm.org
      - NOMINATIM_URL=https://nominatim.openstreetmap.org

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend
```
