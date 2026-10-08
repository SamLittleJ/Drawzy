import itertools
import os
from types import SimpleNamespace

# Must be set before the app is imported so tests never touch a real database.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["BCRYPT_ROUNDS"] = "4"  # fast hashing for tests

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from backend import database, game  # noqa: E402
from backend.connection_manager import manager  # noqa: E402
from backend.database import get_db  # noqa: E402
from backend.main import app  # noqa: E402


@pytest.fixture
def session_factory(monkeypatch):
    """A fresh in-memory database per test, shared by the API, the WebSocket handlers and the game loop.

    The schema is built by the real Alembic migrations, so every test also exercises them.
    """
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    monkeypatch.setattr(database, "engine", engine)
    database.run_migrations()
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr(database, "SessionLocal", factory)
    yield factory
    engine.dispose()


@pytest.fixture
def db(session_factory):
    with session_factory() as session:
        yield session


@pytest.fixture
def client(session_factory, monkeypatch):
    # Async so the session is closed even when TestClient cancels a WebSocket handler on exit.
    async def override_get_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(game, "TURN_END_PAUSE_SECONDS", 0)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    manager.active_connections.clear()
    game._games.clear()


@pytest.fixture
def create_user(client):
    """Register a user, log them in and return their id, credentials and auth headers."""
    counter = itertools.count(1)

    def _create(username: str | None = None, password: str = "secret123"):
        username = username or f"player{next(counter)}"
        email = f"{username}@example.com"
        response = client.post("/users/", json={"username": username, "email": email, "password": password})
        assert response.status_code == 201, response.text
        token = client.post("/users/login", json={"email": email, "password": password}).json()["access_token"]
        return SimpleNamespace(
            id=response.json()["id"],
            username=username,
            email=email,
            password=password,
            token=token,
            headers={"Authorization": f"Bearer {token}"},
        )

    return _create


@pytest.fixture
def create_room(client):
    def _create(owner, **overrides):
        body = {"max_players": 4, "round_time": 60, "max_rounds": 3, "target_score": 100, "is_public": True}
        response = client.post("/rooms/", json=body | overrides, headers=owner.headers)
        assert response.status_code == 201, response.text
        return response.json()

    return _create
