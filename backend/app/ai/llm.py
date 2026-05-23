"""Обёртка LLM с fallback на детерминированный mock.

Поддерживает обычные ответы, стриминг (SSE) и HR-оценку компетенций.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncIterator

from app.core.config import settings
from app.ai.rag import Chunk

log = logging.getLogger("app.llm")


SYSTEM_PROMPT = (
    "Ты — AI-наставник банка Turonbank для новых сотрудников и стажёров. "
    "Отвечай по-русски, кратко (3-6 предложений), деловым тоном. "
    "Используй ТОЛЬКО предоставленные фрагменты регламентов. "
    "Если ответа в регламентах нет — честно скажи, что данных недостаточно, "
    "и предложи обратиться к наставнику или HR. "
    "В конце ответа НЕ добавляй ссылки на источники — они приходят отдельно."
)


def _build_context(chunks: list[tuple[Chunk, float]]) -> str:
    if not chunks:
        return "(нет релевантных фрагментов)"
    parts = []
    for i, (chunk, _score) in enumerate(chunks, 1):
        parts.append(f"[Источник {i}: {chunk.doc_title}]\n{chunk.text}")
    return "\n\n".join(parts)


def _mock_answer(_question: str, chunks: list[tuple[Chunk, float]]) -> str:
    if not chunks:
        return (
            "В загруженных регламентах не нашлось точного ответа на ваш вопрос. "
            "Рекомендую обратиться к вашему наставнику или в HR-отдел."
        )
    top = chunks[0][0]
    snippet = top.text[:500]
    return (
        f"Согласно регламенту «{top.doc_title}»:\n\n"
        f"{snippet}\n\n"
        f"(Ответ собран в mock-режиме без LLM. Задайте ANTHROPIC_API_KEY "
        f"в .env для полноценных ответов.)"
    )


async def generate_answer(question: str, chunks: list[tuple[Chunk, float]]) -> str:
    if not settings.anthropic_api_key:
        return _mock_answer(question, chunks)

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return _mock_answer(question, chunks)

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    user_msg = (
        f"Фрагменты регламентов:\n\n{_build_context(chunks)}\n\n"
        f"Вопрос сотрудника: {question}"
    )
    resp = await client.messages.create(
        model=settings.llm_model,
        max_tokens=600,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )
    return "".join(block.text for block in resp.content if block.type == "text").strip()


async def stream_answer(
    question: str, chunks: list[tuple[Chunk, float]]
) -> AsyncIterator[str]:
    """Стрим ответа по токенам/чанкам."""
    if not settings.anthropic_api_key:
        text = _mock_answer(question, chunks)
        # имитация стрима, чтобы UI чувствовал «живой» эффект
        for word in text.split(" "):
            await asyncio.sleep(0.02)
            yield word + " "
        return

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        yield _mock_answer(question, chunks)
        return

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    user_msg = (
        f"Фрагменты регламентов:\n\n{_build_context(chunks)}\n\n"
        f"Вопрос сотрудника: {question}"
    )
    async with client.messages.stream(
        model=settings.llm_model,
        max_tokens=600,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


# ---------------------------------------------------------------------------
# HR Competency Assessment
# ---------------------------------------------------------------------------

COMPETENCY_SYSTEM = (
    "Ты — HR-аналитик банка Turonbank. На основе данных о прогрессе обучения "
    "сотрудника вынеси краткое суждение о его готовности к работе. "
    "Отвечай ТОЛЬКО валидным JSON по схеме: "
    '{"score": int 0..100, "summary": str (1-2 предложения, по-русски), '
    '"strengths": [str, ...] (1-3 пункта), "gaps": [str, ...] (0-3 пункта), '
    '"recommendation": str (1 конкретное действие)}. '
    "Никаких кодовых ограждений, никакого текста вне JSON."
)


def _mock_competency(
    user: Any,
    total_xp: int,
    overall_pct: float,
    courses: list[dict],
    scenarios: list[dict],
    chat_questions: int,
) -> dict:
    courses_done = sum(1 for c in courses if c.get("completed"))
    scenarios_done = sum(1 for s in scenarios if s.get("best_pct", 0) >= 70)
    weak_courses = [c for c in courses if not c.get("completed") and c.get("lessons_completed", 0) == 0]
    weak_scenarios = [s for s in scenarios if s.get("best_pct", 0) < 50]

    base = int(min(95, overall_pct * 0.7 + (chat_questions * 1.5) + courses_done * 5 + scenarios_done * 6))
    if total_xp == 0:
        base = 5

    strengths: list[str] = []
    if courses_done:
        strengths.append(f"Завершено курсов: {courses_done}")
    if scenarios_done:
        strengths.append(f"Сценариев со зачётом: {scenarios_done}")
    if chat_questions >= 5:
        strengths.append("Активно использует AI-наставника")
    if not strengths:
        strengths = ["Зарегистрирован, ожидает старта"]

    gaps: list[str] = []
    if weak_courses:
        gaps.append(f"Не приступал к курсам: {', '.join(c['title'] for c in weak_courses[:2])}")
    if weak_scenarios:
        gaps.append(
            f"Слабые сценарии: {', '.join(s['title'] for s in weak_scenarios[:2])}"
        )
    if base < 40:
        recommendation = "Назначить трек обучения и провести вводный 1:1."
    elif base < 70:
        recommendation = "Завершить оставшиеся курсы и закрепить практику в симуляторе."
    else:
        recommendation = "Готов к боевым задачам — назначить наставника на первые 2 недели."

    summary = (
        f"{user.full_name}: общий прогресс {overall_pct}%, XP {total_xp}. "
        + ("Динамика хорошая, " if base >= 60 else "Прогресс неравномерный, ")
        + recommendation.lower().rstrip(".")
        + "."
    )

    return {
        "score": int(base),
        "summary": summary,
        "strengths": strengths,
        "gaps": gaps,
        "recommendation": recommendation,
        "mode": "mock",
    }


async def generate_competency_assessment(
    *,
    user,
    total_xp: int,
    overall_pct: float,
    courses: list[dict],
    scenarios: list[dict],
    chat_questions: int,
) -> dict:
    """Возвращает dict с оценкой компетенций (score 0..100, summary, strengths, gaps, recommendation, mode)."""
    if not settings.anthropic_api_key:
        return _mock_competency(user, total_xp, overall_pct, courses, scenarios, chat_questions)

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return _mock_competency(user, total_xp, overall_pct, courses, scenarios, chat_questions)

    snapshot = {
        "full_name": user.full_name,
        "position": user.position,
        "department": user.department,
        "program": user.program,
        "total_xp": total_xp,
        "overall_completion_pct": overall_pct,
        "chat_questions_asked": chat_questions,
        "courses": [
            {
                "title": c["title"],
                "completed": c["completed"],
                "lessons": f"{c['lessons_completed']}/{c['lessons_total']}",
                "quiz": f"{c['quiz_score']}/{c['quiz_max']}",
                "attempts": c["quiz_attempts"],
            }
            for c in courses
        ],
        "scenarios": [
            {"title": s["title"], "best_pct": s["best_pct"], "attempts": s["attempts"]}
            for s in scenarios
        ],
    }

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    user_msg = (
        "Данные по сотруднику (JSON):\n\n"
        + json.dumps(snapshot, ensure_ascii=False, indent=2)
        + "\n\nВыдай оценку строго по схеме."
    )
    try:
        resp = await client.messages.create(
            model=settings.llm_model,
            max_tokens=500,
            system=COMPETENCY_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        text = "".join(b.text for b in resp.content if b.type == "text").strip()
        # на случай ```json блоков
        if text.startswith("```"):
            text = text.strip("`").lstrip("json").strip()
        data = json.loads(text)
        return {
            "score": int(data.get("score", 0)),
            "summary": str(data.get("summary", ""))[:600],
            "strengths": [str(x) for x in data.get("strengths", [])][:5],
            "gaps": [str(x) for x in data.get("gaps", [])][:5],
            "recommendation": str(data.get("recommendation", ""))[:300],
            "mode": "live",
        }
    except Exception:
        log.exception("competency LLM call failed; falling back to mock")
        return _mock_competency(user, total_xp, overall_pct, courses, scenarios, chat_questions)
