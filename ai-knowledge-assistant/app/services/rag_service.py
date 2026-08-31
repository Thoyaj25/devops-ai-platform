from app.bedrock import BedrockService
from app.config import settings
from app.services.document_loader import load_text_document
from app.services.embedding_service import EmbeddingService
from app.services.text_chunker import chunk_text
from app.services.vector_store import SearchResult, VectorStore


class RAGService:
    def __init__(
        self,
        embedding_service: EmbeddingService | None = None,
        vector_store: VectorStore | None = None,
        bedrock_service: BedrockService | None = None,
    ) -> None:
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = vector_store or VectorStore(
            dimension=settings.embedding_dimension
        )
        self.bedrock_service = bedrock_service or BedrockService()

        self.initialized = False

    def ingest_document(
        self,
        document_path: str,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ) -> int:
        document = load_text_document(document_path)

        chunks = chunk_text(
            document,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

        embeddings = [
            self.embedding_service.embed_document(chunk)
            for chunk in chunks
        ]

        self.vector_store.add(
            embeddings=embeddings,
            documents=chunks,
        )

        self.initialized = True

        return len(chunks)

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
    ) -> list[SearchResult]:
        if not self.initialized:
            raise RuntimeError("RAG service has not been initialized")

        query_embedding = self.embedding_service.embed_query(query)

        return self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
        )

    def answer(
        self,
        query: str,
        top_k: int = 3,
    ) -> str:
        results = self.retrieve(
            query=query,
            top_k=top_k,
        )

        if not results:
            return "I could not find relevant information in the knowledge base."

        context = "\n\n".join(
            result.text
            for result in results
        )

        prompt = f"""You are a knowledge assistant.

Answer the user's question using only the information provided in the
knowledge base context below.

If the answer cannot be determined from the context, say that the
information is not available in the knowledge base.

Do not invent or add unsupported facts.

Knowledge base context:
-----------------------
{context}
-----------------------

User question:
{query}
"""

        return self.bedrock_service.generate(prompt)
