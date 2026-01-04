import os

# Use local SQLite for test runs to avoid psycopg2 dependency
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.database import Base, engine  # noqa: E402  pylint: disable=wrong-import-position
import pytest


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Initialize a clean SQLite schema for the test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
