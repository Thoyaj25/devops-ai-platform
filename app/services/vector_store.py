from dataclasses import dataclass

import faiss
import numpy as np


@dataclass
class SearchResult:
    text: str
    score: float


class VectorStore:
    def __init__(self, dimension: int = 1536) -> None:
        if dimension <= 0:
            raise ValueError("dimension must be greater than 0")

        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.documents: list[str] = []

    def add(self, embeddings: list[list[float]], documents: list[str]) -> None:
        if len(embeddings) != len(documents):
            raise ValueError(
                "embeddings and documents must have the same length"
            )

        if not embeddings:
            return

        vectors = np.asarray(embeddings, dtype=np.float32)

        if vectors.ndim != 2 or vectors.shape[1] != self.dimension:
            raise ValueError(
                f"embeddings must have shape (n, {self.dimension})"
            )

        self.index.add(vectors)
        self.documents.extend(documents)

    def search(
        self,
        query_embedding: list[float],
        top_k: int = 3,
    ) -> list[SearchResult]:
        if top_k <= 0:
            raise ValueError("top_k must be greater than 0")

        if not self.documents:
            return []

        query = np.asarray(
            [query_embedding],
            dtype=np.float32,
        )

        if query.shape[1] != self.dimension:
            raise ValueError(
                f"query embedding must have dimension {self.dimension}"
            )

        k = min(top_k, len(self.documents))

        distances, indices = self.index.search(query, k)

        results = []

        for distance, index in zip(distances[0], indices[0]):
            results.append(
                SearchResult(
                    text=self.documents[index],
                    score=float(distance),
                )
            )

        return results
