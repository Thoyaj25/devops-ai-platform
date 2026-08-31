from pathlib import Path


def load_text_document(path: str) -> str:
    document_path = Path(path)

    if not document_path.exists():
        raise FileNotFoundError(f"Document not found: {path}")

    if not document_path.is_file():
        raise ValueError(f"Path is not a file: {path}")

    return document_path.read_text(encoding="utf-8")
