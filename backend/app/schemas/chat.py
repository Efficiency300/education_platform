from datetime import datetime
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id: int
    message: str = Field(min_length=1, max_length=4000)
    # User-selected UI locale ("ru" | "uz" | "en"). Forwarded to the LLM so the
    # answer comes back in the same language the user is reading the rest of
    # the app in.
    locale: str | None = None


class Source(BaseModel):
    title: str
    snippet: str
    score: float


class KnowledgeInstructionRef(BaseModel):
    id: int | None = None
    knowledge_filename: str = ""
    verification_status: str = ""


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = []
    response_ms: int
    # Populated when the answer was auto-promoted to the knowledge base so the
    # UI can render the "added to knowledge base" plate with a delete action.
    knowledge_instruction: KnowledgeInstructionRef | None = None


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
