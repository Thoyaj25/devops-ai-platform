from unittest.mock import MagicMock

import pytest

from app.services.rag_service import RAGService


def test_ingest_document():
    embedding_service = MagicMock()
    vector_store = MagicMock()
    bedrock_service = MagicMock()

    embedding_service.embed_document.side_effect = [
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
    ]

    service = RAGService(
        embedding_service=embedding_service,
        vector_store=vector_store,
        bedrock_service=bedrock_service,
    )

    chunks = service.ingest_document(
        "documents/kubernetes.txt",
        chunk_size=500,
        chunk_overlap=50,
    )

    assert chunks == 2
    assert service.initialized is True

    assert embedding_service.embed_document.call_count == 2
    vector_store.add.assert_called_once()


def test_retrieve():
    embedding_service = MagicMock()
    vector_store = MagicMock()
    bedrock_service = MagicMock()

    embedding_service.embed_query.return_value = [1.0, 0.0, 0.0]

    service = RAGService(
        embedding_service=embedding_service,
        vector_store=vector_store,
        bedrock_service=bedrock_service,
    )

    service.initialized = True

    vector_store.search.return_value = []

    results = service.retrieve(
        query="What is Kubernetes?",
        top_k=2,
    )

    assert results == []

    embedding_service.embed_query.assert_called_once_with(
        "What is Kubernetes?"
    )

    vector_store.search.assert_called_once_with(
        query_embedding=[1.0, 0.0, 0.0],
        top_k=2,
    )


def test_retrieve_before_initialization():
    service = RAGService(
        embedding_service=MagicMock(),
        vector_store=MagicMock(),
        bedrock_service=MagicMock(),
    )

    with pytest.raises(
        RuntimeError,
        match="RAG service has not been initialized",
    ):
        service.retrieve(
            query="What is Kubernetes?",
            top_k=2,
        )


def test_answer():
    embedding_service = MagicMock()
    vector_store = MagicMock()
    bedrock_service = MagicMock()

    embedding_service.embed_query.return_value = [1.0, 0.0, 0.0]

    result_1 = MagicMock()
    result_1.text = "Pods are the smallest deployable units in Kubernetes."

    result_2 = MagicMock()
    result_2.text = "Pods can contain one or more containers."

    vector_store.search.return_value = [
        result_1,
        result_2,
    ]

    bedrock_service.generate.return_value = (
        "A Pod is the smallest deployable unit in Kubernetes."
    )

    service = RAGService(
        embedding_service=embedding_service,
        vector_store=vector_store,
        bedrock_service=bedrock_service,
    )

    service.initialized = True

    answer = service.answer(
        query="What is a Kubernetes Pod?",
        top_k=2,
    )

    assert answer == (
        "A Pod is the smallest deployable unit in Kubernetes."
    )

    bedrock_service.generate.assert_called_once()

    prompt = bedrock_service.generate.call_args.args[0]

    assert "Pods are the smallest deployable units" in prompt
    assert "Pods can contain one or more containers" in prompt
    assert "What is a Kubernetes Pod?" in prompt


def test_answer_with_no_results():
    embedding_service = MagicMock()
    vector_store = MagicMock()
    bedrock_service = MagicMock()

    embedding_service.embed_query.return_value = [1.0, 0.0, 0.0]

    vector_store.search.return_value = []

    service = RAGService(
        embedding_service=embedding_service,
        vector_store=vector_store,
        bedrock_service=bedrock_service,
    )

    service.initialized = True

    answer = service.answer(
        query="What is something unknown?",
        top_k=3,
    )

    assert answer == (
        "I could not find relevant information in the knowledge base."
    )

    bedrock_service.generate.assert_not_called()
