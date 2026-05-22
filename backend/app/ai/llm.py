"""Обёртка LLM с fallback на детерминированный mock, если нет API-ключа.

Это позволяет запускать MVP без внешних зависимостей — чатбот будет
отвечать выдержками из найденных RAG-фрагментов.
"""
from __future__ import annotations

from app.core.config import settings
from app.ai.rag import Chunk


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
    for i, (chunk, score) in enumerate(chunks, 1):
        parts.append(f"[Источник {i}: {chunk.doc_title}]\n{chunk.text}")
    return "\n\n".join(parts)


def _mock_answer(question: str, chunks: list[tuple[Chunk, float]]) -> str:
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


async def generate_answer(
    question: str, chunks: list[tuple[Chunk, float]]
) -> str:
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
