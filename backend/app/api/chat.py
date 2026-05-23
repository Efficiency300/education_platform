import json
import time
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session, SessionLocal
from app.db.models import ChatMessage, User
from app.db.activity import log_activity
from app.schemas.chat import ChatRequest, ChatResponse, Source, ChatMessageOut
from app.ai.rag import rag_index
from app.ai.llm import generate_answer, stream_answer

log = logging.getLogger("app.chat")
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
    log.info("chat ask user=%s ms=%s hits=%s", user.id, elapsed_ms, len(hits))

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
    await log_activity(
        db,
        user_id=user.id,
        kind="chat_asked",
        title="Вопрос AI-наставнику",
        detail=payload.message[:140],
    )
    await db.commit()

    return ChatResponse(answer=answer_text, sources=sources, response_ms=elapsed_ms)


@router.post("/stream")
async def ask_stream(payload: ChatRequest):
    """Server-Sent Events стрим ответа.

    События:
      - data: {"type":"sources","sources":[...]}
      - data: {"type":"chunk","text":"..."}
      - data: {"type":"done","ms":123}
    """
    # пользователь проверяется отдельной сессией (стрим живёт долго)
    async with SessionLocal() as db:
        user = await db.get(User, payload.user_id)
        if not user:
            raise HTTPException(404, "User not found")

    hits = rag_index.search(payload.message, top_k=4)
    sources = [
        {"title": c.doc_title, "snippet": c.text[:240], "score": round(s, 3)}
        for c, s in hits
    ]

    async def gen():
        started = time.perf_counter()
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
        buf: list[str] = []
        try:
            async for chunk in stream_answer(payload.message, hits):
                buf.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        except Exception as e:  # noqa: BLE001
            log.exception("stream failed")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        full_text = "".join(buf).strip()

        # persist
        async with SessionLocal() as db:
            db.add_all(
                [
                    ChatMessage(user_id=payload.user_id, role="user", content=payload.message),
                    ChatMessage(
                        user_id=payload.user_id,
                        role="assistant",
                        content=full_text,
                        sources=sources,
                    ),
                ]
            )
            await log_activity(
                db,
                user_id=payload.user_id,
                kind="chat_asked",
                title="Вопрос AI-наставнику",
                detail=payload.message[:140],
            )
            await db.commit()

        yield f"data: {json.dumps({'type': 'done', 'ms': elapsed_ms})}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


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
