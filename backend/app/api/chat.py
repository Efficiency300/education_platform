import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import ChatMessage, User
from app.schemas.chat import ChatRequest, ChatResponse, Source, ChatMessageOut
from app.ai.rag import rag_index
from app.ai.llm import generate_answer

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def ask(payload: ChatRequest, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    started = time.perf_counter()
    hits = rag_index.search(payload.message, top_k=4)
    answer_text = await generate_answer(payload.message, hits)
    elapsed_ms = int((time.perf_counter() - started) * 1000)

    sources = [
        Source(title=chunk.doc_title, snippet=chunk.text[:240], score=round(score, 3))
        for chunk, score in hits
    ]

    db.add_all(
        [
            ChatMessage(user_id=user.id, role="user", content=payload.message),
            ChatMessage(
                user_id=user.id,
                role="assistant",
                content=answer_text,
                sources=[s.model_dump() for s in sources],
            ),
        ]
    )
    await db.commit()

    return ChatResponse(answer=answer_text, sources=sources, response_ms=elapsed_ms)


@router.get("/history/{user_id}", response_model=list[ChatMessageOut])
async def history(user_id: int, db: AsyncSession = Depends(get_session)):
    rows = (
        await db.scalars(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.id)
        )
    ).all()
    return rows
