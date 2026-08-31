from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "AI Knowledge Assistant API is running"
    }


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "environment": "development",
    }


def test_generate(monkeypatch):
    def mock_generate(prompt: str) -> str:
        assert prompt == "Explain Kubernetes"
        return "Kubernetes is a container orchestration platform."

    monkeypatch.setattr(
        "app.main.bedrock_service.generate",
        mock_generate,
    )

    response = client.post(
        "/generate",
        json={"prompt": "Explain Kubernetes"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "response": "Kubernetes is a container orchestration platform."
    }


def test_generate_validation_error():
    response = client.post(
        "/generate",
        json={},
    )

    assert response.status_code == 422
