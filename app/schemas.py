from pydantic import BaseModel


class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    response: str


class AskRequest(BaseModel):
    question: str
    top_k: int = 3


class AskResponse(BaseModel):
    answer: str
