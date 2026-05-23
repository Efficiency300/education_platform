import json
import re
import time
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag import rag_index
from app.ai.llm import generate_answer, stream_answer
from app.ai.agent import agent_answer
from app.core.config import settings
from app.db.session import get_session, SessionLocal
from app.db.models import ChatMessage, KnowledgeInstruction, User
from app.db.activity import log_activity
from app.schemas.chat import (
    ChatMessageOut,
    ChatRequest,
    ChatResponse,
    KnowledgeInstructionRef,
    Source,
)

log = logging.getLogger("app.chat")
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def ask(payload: ChatRequest, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    started = time.perf_counter()
    # Route through the LangGraph-backed agent so Gemini drives the answer and
    # the AI assistant + North share the same reasoning path. The agent runs
    # RAG itself and returns the citations it actually used. We pass the
    # user's department/job_title as the *direction* so Qdrant scopes the
    # search — admin-classified files only land for the right team.
    direction = (user.job_title or user.department or "").strip() or None
    answer_text, hits = await agent_answer(
        payload.message, top_k=4, direction=direction, locale=payload.locale,
    )
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

    # NOTE: We deliberately do NOT auto-promote chat answers to the knowledge
    # base any more. Only canonical answers in team chat go through review
    # (see app.api.teams). The KnowledgeInstruction table is kept for older
    # rows + manual admin use.
    await db.commit()

    return ChatResponse(
        answer=answer_text,
        sources=sources,
        response_ms=elapsed_ms,
        knowledge_instruction=None,
    )


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
            async for chunk in stream_answer(payload.message, hits, locale=payload.locale):
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
            .where(ChatMessage.deleted.is_(False) if hasattr(ChatMessage, "deleted") else True)  # type: ignore[arg-type]
            .order_by(ChatMessage.id)
        )
    ).all()
    return rows


# ---------------------------------------------------------------------------
# AI auto-knowledge helpers
# ---------------------------------------------------------------------------


_INSTRUCTION_PATTERNS = re.compile(
    r"(шаг\s+\d+|step\s+\d+|следует|необходимо|надо|нужно|должен|нельзя|порядок|алгоритм|инструкция|"
    r"чтобы\s+[a-zа-я]+|how\s+to|you\s+should|must)",
    re.IGNORECASE,
)


def _looks_like_instruction(question: str, answer: str) -> bool:
    """Heuristic — promote answers that read like reusable instructions.

    We look for "how do I…" / "что делать…" / "какой порядок…" questions paired
    with answers that have at least two sentences and contain instruction
    vocabulary (steps, "следует", "необходимо", numbered/bulleted lists)."""
    q = (question or "").strip().lower()
    a = (answer or "").strip()
    if not q or len(a) < 80:
        return False
    if not any(
        marker in q
        for marker in (
            "как ",
            "что делать",
            "какой ",
            "какие ",
            "какова",
            "where ",
            "how ",
            "what ",
            "should",
            "когда ",
        )
    ):
        return False
    if not _INSTRUCTION_PATTERNS.search(a):
        return False
    # Numbered lists / bullets / "1." steps are strong signals too.
    return bool(
        re.search(r"(^|\n)\s*[-*•]\s", a) or re.search(r"(^|\n)\s*\d+[.)]\s", a) or len(a.split(".")) >= 3
    )


def _safe_filename_stem(text: str, max_len: int = 60) -> str:
    stem = re.sub(r"[^A-Za-zА-Яа-я0-9_\-]+", "_", text)[:max_len].strip("_")
    return stem or "ai_instruction"


async def _record_instruction(
    db: AsyncSession,
    *,
    question: str,
    answer: str,
    sources: list[dict],
    origin_user_id: int,
    direction: str,
) -> KnowledgeInstructionRef | None:
    """Persist the instruction + write a markdown file into the knowledge base
    so the AI assistant can cite it in future answers."""
    # Skip duplicates: if we already have a recent identical question we keep
    # one row instead of growing the list.
    existing = await db.scalar(
        select(KnowledgeInstruction).where(KnowledgeInstruction.question == question.strip())
    )
    if existing is not None:
        return KnowledgeInstructionRef(
            id=existing.id,
            knowledge_filename=existing.knowledge_filename or "",
            verification_status=existing.verification_status or "unverified",
        )

    # Verification status: sources present = "verified" (RAG corroborated);
    # otherwise admin must double-check open resources.
    status = "verified" if sources else "unverified"
    verification_notes = (
        f"Подтверждено {len(sources)} источниками из базы знаний."
        if sources
        else "Источник не найден — необходимо проверить вручную."
    )

    settings.regulations_path.mkdir(parents=True, exist_ok=True)
    stem = _safe_filename_stem(question)
    filename = f"ai-instruction-{int(time.time())}-{stem}.md"
    body_lines = [f"# {question.strip()}", ""]
    if direction:
        body_lines.append(f"**Направление:** {direction}")
    body_lines.extend(["", "## Ответ AI-ассистента", "", answer.strip(), ""])
    if sources:
        body_lines.append("## Источники")
        for s in sources:
            title = s.get("title") or "источник"
            snippet = (s.get("snippet") or "").strip()
            body_lines.append(f"- **{title}** — {snippet[:200]}")
    try:
        (settings.regulations_path / filename).write_text(
            "\n".join(body_lines), encoding="utf-8"
        )
        # Refresh the BM25 index so the new instruction can be cited
        # immediately by subsequent chat requests.
        rag_index.load_dir(settings.regulations_path)
    except Exception:
        filename = ""

    row = KnowledgeInstruction(
        question=question.strip(),
        answer=answer.strip(),
        sources=sources,
        verification_status=status,
        verification_notes=verification_notes,
        knowledge_filename=filename,
        origin="chat",
        origin_user_id=origin_user_id,
        direction=direction or "",
    )
    db.add(row)
    await db.flush()
    return KnowledgeInstructionRef(
        id=row.id,
        knowledge_filename=row.knowledge_filename,
        verification_status=row.verification_status,
    )
