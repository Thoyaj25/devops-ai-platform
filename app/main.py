from fastapi import FastAPI

app = FastAPI(
    title="AI Knowledge Assistant",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "message": "AI Knowledge Assistant API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
