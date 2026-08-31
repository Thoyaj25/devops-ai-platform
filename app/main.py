from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.bedrock import bedrock_service
from app.config import settings
from app.rag import rag_service
from app.schemas import (
    AskRequest,
    AskResponse,
    GenerateRequest,
    GenerateResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag_service.ingest_document(
        "documents/kubernetes.txt"
    )

    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {
        "message": f"{settings.app_name} API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "environment": settings.environment,
    }


@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest):
    response = bedrock_service.generate(request.prompt)

    return GenerateResponse(
        response=response
    )


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    answer = rag_service.answer(
        query=request.question,
        top_k=request.top_k,
    )

    return AskResponse(
        answer=answer
    )
