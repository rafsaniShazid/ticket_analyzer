import os

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"

from fastapi.testclient import TestClient
from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import sessionmaker

from app import main
from app.database import Base, get_db


test_engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(bind=test_engine, expire_on_commit=False)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


main.app.dependency_overrides[get_db] = override_get_db
client = TestClient(main.app)


def setup_function() -> None:
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    main.app.dependency_overrides[get_db] = override_get_db


def test_health_reports_connected_database() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "database": "connected"}


def test_create_and_list_tickets_newest_first(monkeypatch) -> None:
    monkeypatch.setattr(main, "analyze_sentiment", lambda _: ("positive", 0.98))

    first = client.post(
        "/tickets",
        json={"title": "First", "message": "Everything works"},
    )
    second = client.post(
        "/tickets",
        json={
            "title": "Second",
            "message": "Still working",
            "category": "billing",
        },
    )
    listed = client.get("/tickets")

    assert first.status_code == 201
    assert first.json()["category"] == "general"
    assert first.json()["sentiment"] == "positive"
    assert first.json()["confidence"] == 0.98
    assert second.status_code == 201
    assert listed.status_code == 200
    assert [ticket["title"] for ticket in listed.json()] == ["Second", "First"]


def test_create_ticket_rejects_blank_required_fields() -> None:
    response = client.post(
        "/tickets",
        json={"title": "   ", "message": "   "},
    )

    assert response.status_code == 422


def test_sentiment_failure_returns_503(monkeypatch) -> None:
    def fail(_: str):
        raise RuntimeError("model unavailable")

    monkeypatch.setattr(main, "analyze_sentiment", fail)
    response = client.post(
        "/tickets",
        json={"title": "Cannot classify", "message": "Some message"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Sentiment service unavailable"


def test_database_failure_returns_503() -> None:
    class BrokenSession:
        def execute(self, *_args, **_kwargs):
            from sqlalchemy.exc import OperationalError

            raise OperationalError("SELECT 1", {}, Exception("offline"))

    def override_broken_db():
        yield BrokenSession()

    main.app.dependency_overrides[get_db] = override_broken_db
    response = client.get("/health")

    assert response.status_code == 503
    assert response.json()["detail"] == "Database unavailable"
