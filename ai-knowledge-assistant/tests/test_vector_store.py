import pytest

from app.services.vector_store import VectorStore


def test_add_and_search():
    store = VectorStore(dimension=3)

    store.add(
        embeddings=[
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0],
        ],
        documents=[
            "Kubernetes manages containers.",
            "Docker builds container images.",
            "Terraform manages infrastructure.",
        ],
    )

    results = store.search(
        query_embedding=[1.0, 0.0, 0.0],
        top_k=2,
    )

    assert len(results) == 2
    assert results[0].text == "Kubernetes manages containers."
    assert results[0].score == pytest.approx(0.0)


def test_empty_store():
    store = VectorStore(dimension=3)

    results = store.search(
        query_embedding=[1.0, 0.0, 0.0],
        top_k=3,
    )

    assert results == []


def test_mismatched_lengths():
    store = VectorStore(dimension=3)

    with pytest.raises(
        ValueError,
        match="same length",
    ):
        store.add(
            embeddings=[[1.0, 0.0, 0.0]],
            documents=[],
        )


def test_invalid_embedding_dimension():
    store = VectorStore(dimension=3)

    with pytest.raises(
        ValueError,
        match="shape",
    ):
        store.add(
            embeddings=[[1.0, 0.0]],
            documents=["invalid"],
        )


def test_invalid_top_k():
    store = VectorStore(dimension=3)

    with pytest.raises(
        ValueError,
        match="top_k must be greater than 0",
    ):
        store.search(
            query_embedding=[1.0, 0.0, 0.0],
            top_k=0,
        )
