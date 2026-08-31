from fastapi import FastAPI

from app.bedrock import bedrock_service
from app.config import settings
from app.schemas import GenerateRequest, GenerateResponse


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
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
