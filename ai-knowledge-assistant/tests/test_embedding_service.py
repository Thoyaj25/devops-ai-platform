from unittest.mock import MagicMock

import pytest

from app.services.embedding_service import EmbeddingService


def test_embed_document():
    service = EmbeddingService()
    service.client = MagicMock()

    service.client.invoke_model.return_value = {
        "body": MagicMock(
            read=MagicMock(
                return_value=b'{"embeddings":{"float":[[0.1,0.2,0.3]]}}'
            )
        )
    }

    result = service.embed_document(
        "Kubernetes is a container orchestration platform."
    )

    assert result == [0.1, 0.2, 0.3]

    service.client.invoke_model.assert_called_once()


def test_embed_query():
    service = EmbeddingService()
    service.client = MagicMock()

    service.client.invoke_model.return_value = {
        "body": MagicMock(
            read=MagicMock(
                return_value=b'{"embeddings":{"float":[[0.4,0.5,0.6]]}}'
            )
        )
    }

    result = service.embed_query("What is Kubernetes?")

    assert result == [0.4, 0.5, 0.6]


def test_empty_text():
    service = EmbeddingService()
    service.client = MagicMock()

    with pytest.raises(
        ValueError,
        match="text must not be empty",
    ):
        service.embed_document("   ")

    service.client.invoke_model.assert_not_called()
