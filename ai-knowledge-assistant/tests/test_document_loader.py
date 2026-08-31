from pathlib import Path

import pytest

from app.services.document_loader import load_text_document


def test_load_text_document(tmp_path: Path):
    document = tmp_path / "example.txt"
    document.write_text("Hello knowledge base.", encoding="utf-8")

    result = load_text_document(str(document))

    assert result == "Hello knowledge base."


def test_load_text_document_missing_file():
    with pytest.raises(
        FileNotFoundError,
        match="Document not found",
    ):
        load_text_document("documents/missing.txt")


def test_load_text_document_directory(tmp_path: Path):
    directory = tmp_path / "documents"
    directory.mkdir()

    with pytest.raises(
        ValueError,
        match="Path is not a file",
    ):
        load_text_document(str(directory))
