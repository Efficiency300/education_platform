from datetime import datetime
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id: int
    message: str = Field(min_length=1, max_length=4000)


class Source(BaseModel):
    title: str
    snippet: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = []
    response_ms: int


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
