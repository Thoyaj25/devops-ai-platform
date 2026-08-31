from fastapi import FastAPI

from app.config import settings


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
