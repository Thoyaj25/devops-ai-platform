import pytest

from app.services.text_chunker import chunk_text


def test_chunk_text():
    text = "abcdefghijklmnopqrstuvwxyz"

    chunks = chunk_text(
        text,
        chunk_size=10,
        chunk_overlap=2,
    )

    assert chunks == [
        "abcdefghij",
        "ijklmnopqr",
        "qrstuvwxyz",
    ]


def test_empty_text():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_invalid_chunk_size():
    with pytest.raises(
        ValueError,
        match="chunk_size must be greater than 0",
    ):
        chunk_text("hello", chunk_size=0)


def test_negative_overlap():
    with pytest.raises(
        ValueError,
        match="chunk_overlap cannot be negative",
    ):
        chunk_text("hello", chunk_overlap=-1)


def test_overlap_must_be_smaller_than_chunk_size():
    with pytest.raises(
        ValueError,
        match="chunk_overlap must be smaller than chunk_size",
    ):
        chunk_text(
            "hello",
            chunk_size=10,
            chunk_overlap=10,
        )
