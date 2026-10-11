import os
import tempfile

import pytest

# Point the application at an isolated throwaway SQLite database for the test
# session. This must happen before any backend module imports the settings,
# because settings capture DATABASE_URL at import time.
_TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "routeoptima_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB_PATH}"

from backend.app.database import Base, engine  # noqa: E402
from backend.app.database import run_migrations  # noqa: E402
from backend.app import models  # noqa: E402,F401  (register ORM models on Base)


@pytest.fixture(scope="session", autouse=True)
def _prepare_database():
    if os.path.exists(_TEST_DB_PATH):
        os.remove(_TEST_DB_PATH)
    Base.metadata.create_all(bind=engine)
    run_migrations()
    yield
    engine.dispose()
    if os.path.exists(_TEST_DB_PATH):
        os.remove(_TEST_DB_PATH)
