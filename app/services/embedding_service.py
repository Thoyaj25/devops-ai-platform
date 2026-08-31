import json

import boto3

from app.config import settings


class EmbeddingService:
    def __init__(self) -> None:
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
        )
        self.model_id = "us.cohere.embed-v4:0"

    def embed_document(self, text: str) -> list[float]:
        return self._embed(text, "search_document")

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text, "search_query")

    def _embed(self, text: str, input_type: str) -> list[float]:
        if not text.strip():
            raise ValueError("text must not be empty")

        response = self.client.invoke_model(
            modelId=self.model_id,
            body=json.dumps(
                {
                    "texts": [text],
                    "input_type": input_type,
                    "embedding_types": ["float"],
                }
            ),
            contentType="application/json",
            accept="application/json",
        )

        body = json.loads(response["body"].read())

        return body["embeddings"]["float"][0]
