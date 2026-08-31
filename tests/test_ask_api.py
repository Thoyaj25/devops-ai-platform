from fastapi.testclient import TestClient

from app.main import app
from app.rag import rag_service


def test_ask_endpoint(monkeypatch):
    monkeypatch.setattr(
        rag_service,
        "answer",
        lambda query, top_k: (
            "A Pod is the smallest deployable unit in Kubernetes."
        ),
    )

    with TestClient(app) as client:
        response = client.post(
            "/ask",
            json={
                "question": "What is a Kubernetes Pod?",
                "top_k": 2,
            },
        )

    assert response.status_code == 200

    data = response.json()

    assert data["answer"] == (
        "A Pod is the smallest deployable unit in Kubernetes."
    )


def test_ask_endpoint_default_top_k(monkeypatch):
    captured = {}

    def fake_answer(query, top_k):
        captured["query"] = query
        captured["top_k"] = top_k
        return "test answer"

    monkeypatch.setattr(
        rag_service,
        "answer",
        fake_answer,
    )

    with TestClient(app) as client:
        response = client.post(
            "/ask",
            json={
                "question": "What is Kubernetes?"
            },
        )

    assert response.status_code == 200
    assert response.json()["answer"] == "test answer"
    assert captured["query"] == "What is Kubernetes?"
    assert captured["top_k"] == 3


def test_ask_endpoint_validation():
    with TestClient(app) as client:
        response = client.post(
            "/ask",
            json={},
        )

    assert response.status_code == 422
