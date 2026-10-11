import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env file from workspace root or backend
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "AI-Based Complexity-Aware Delivery Route Optimization System"
    VERSION: str = "1.0.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./delivery.db")
    
    # Routing Configuration
    ROUTING_PROVIDER: str = os.getenv("ROUTING_PROVIDER", "osrm").lower()
    OSRM_URL: str = os.getenv("OSRM_URL", "https://router.project-osrm.org")
    NOMINATIM_URL: str = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org")
    
    # Optimization Configuration
    MAX_OPTIMIZATION_TIME: int = int(os.getenv("MAX_OPTIMIZATION_TIME", "30"))
    GENETIC_POPULATION_SIZE: int = int(os.getenv("GENETIC_POPULATION_SIZE", "50"))
    GENETIC_GENERATIONS: int = int(os.getenv("GENETIC_GENERATIONS", "80"))
    
    # Simulation & GPS Telemetry Security
    SIMULATION_SPEED: float = float(os.getenv("SIMULATION_SPEED", "1.0"))
    SIMULATION_API_KEY: str = os.getenv("SIMULATION_API_KEY", "dev-telemetry-key-2026")

    # CORS: comma-separated list of allowed origins. "*" allows any origin
    # (development only); set explicit origins before deploying.
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    # ML Model Path
    ML_MODEL_PATH: Path = BASE_DIR / "backend" / "ml" / "model.joblib"
    ML_METRICS_PATH: Path = BASE_DIR / "backend" / "ml" / "metrics.json"
    DATA_DIR: Path = BASE_DIR / "data"

settings = Settings()
