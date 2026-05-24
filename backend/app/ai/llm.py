"""LLM wrapper. Primary provider: Google Gemini (via REST). Fallback: Anthropic.
If neither is configured, every call falls back to a deterministic mock so the
app stays usable in offline / demo mode.

Public entry points used elsewhere in the app:
- generate_answer(question, chunks) -> str
- stream_answer(question, chunks) -> AsyncIterator[str]
- generate_competency_assessment(...) -> dict
- chat_completion(prompt, *, system=None, json_mode=False) -> str
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, AsyncIterator

import httpx

from app.core.config import settings
from app.ai.rag import Chunk

log = logging.getLogger("app.llm")


SYSTEM_PROMPT = (
    "Ты — AI-ассистент для онбординга новых сотрудников. Помогай с "
    "рабочими и техническими вопросами (программирование, инструменты, "
    "процессы) и с внутренними регламентами компании.\n\n"
    "Если во фрагментах базы знаний есть релевантный материал — опирайся "
    "на него в первую очередь. Если базы знаний по теме нет (например "
    "общий вопрос про FastAPI, Python, SQL) — отвечай из своих общих "
    "знаний и коротко отметь, что во внутренней документации это не "
    "описано. Не отказывайся помочь только потому, что тема не покрыта "
    "базой знаний — отказ уместен только если тема вне твоей компетенции.\n"
    "Отвечай по делу (3-8 предложений), деловым тоном. Источники в тексте "
    "не упоминай — они приходят отдельным каналом."
)


_LANG_LABELS: dict[str, str] = {
    "ru": "русском",
    "uz": "узбекском (oʻzbekcha, латиница)",
    "en": "английском",
}


def _with_locale(system: str, locale: str | None) -> str:
    """Append a single, hard rule about the answer language so the LLM doesn't
    fall back to the language of the user's question or of the source material."""
    if not locale:
        return system
    label = _LANG_LABELS.get(locale)
    if not label:
        return system
    # Strong, repeated instruction — Gemini sometimes ignores a single sentence.
    if locale == "uz":
        return (
            f"{system}\n\n"
            "MUHIM: javobni FAQAT oʻzbek tilida (lotin yozuvi, oʻzbekcha) "
            "yoz. Hatto savol rus yoki ingliz tilida boʻlsa ham, javob "
            "faqat oʻzbekcha boʻlishi kerak. Rus yoki ingliz soʻzlarini "
            "ishlatma, faqat oʻzbek tili."
        )
    if locale == "en":
        return (
            f"{system}\n\n"
            "IMPORTANT: reply STRICTLY in English. Even if the question or "
            "the source material is in another language, the answer must be "
            "in English only."
        )
    return (
        f"{system}\n\n"
        f"ВАЖНО: отвечай строго на {label} языке, "
        "даже если вопрос или фрагменты базы знаний на другом языке."
    )


GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _build_context(chunks: list[tuple[Chunk, float]]) -> str:
    if not chunks:
        return "(нет релевантных фрагментов)"
    parts = []
    for i, (chunk, _score) in enumerate(chunks, 1):
        parts.append(f"[Источник {i}: {chunk.doc_title}]\n{chunk.text}")
    return "\n\n".join(parts)


def _mock_answer(_question: str, chunks: list[tuple[Chunk, float]]) -> str:
    """Used only when no LLM provider is configured. We can't answer general
    questions in this mode, so be honest about *why* — don't blame the KB."""
    if not chunks:
        return (
            "Сейчас языковая модель не подключена, и в базе знаний по этому "
            "вопросу ничего не нашлось. Установите `GEMINI_API_KEY` в "
            "`.env`, чтобы получать развёрнутые ответы по общим темам "
            "(программирование, инструменты, процессы)."
        )
    top = chunks[0][0]
    snippet = top.text[:500]
    return (
        f"Согласно документу «{top.doc_title}»:\n\n"
        f"{snippet}\n\n"
        f"(Ответ собран без LLM. Задайте GEMINI_API_KEY в .env, чтобы я мог "
        f"отвечать развёрнуто и по общим темам тоже.)"
    )


# ---------------------------------------------------------------------------
# Gemini transport (REST, no SDK dependency)
# ---------------------------------------------------------------------------


async def _gemini_generate(prompt: str, *, system: str | None = None, max_tokens: int = 600,
                            json_mode: bool = False) -> str:
    """Single-shot call. Returns the model text or raises for the caller to handle."""
    url = f"{GEMINI_BASE}/models/{settings.gemini_model}:generateContent"
    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.4,
        },
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            url,
            params={"key": settings.gemini_api_key},
            json=body,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts).strip()


async def _gemini_stream(prompt: str, *, system: str | None = None,
                         max_tokens: int = 600) -> AsyncIterator[str]:
    url = f"{GEMINI_BASE}/models/{settings.gemini_model}:streamGenerateContent"
    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.4},
    }
    if system:
        body["systemInstruction"] = {"parts": [{"text": system}]}

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            url,
            params={"key": settings.gemini_api_key, "alt": "sse"},
            json=body,
            headers={"Content-Type": "application/json"},
        ) as r:
            r.raise_for_status()
            async for raw in r.aiter_lines():
                if not raw or not raw.startswith("data:"):
                    continue
                payload = raw[5:].strip()
                if not payload or payload == "[DONE]":
                    continue
                try:
                    obj = json.loads(payload)
                except Exception:
                    continue
                for cand in obj.get("candidates", []):
                    for part in cand.get("content", {}).get("parts", []):
                        text = part.get("text")
                        if text:
                            yield text


# ---------------------------------------------------------------------------
# Anthropic fallback (only if explicitly configured)
# ---------------------------------------------------------------------------


async def _anthropic_generate(prompt: str, *, system: str | None = None,
                              max_tokens: int = 600) -> str:
    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return ""
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    resp = await client.messages.create(
        model=settings.llm_model,
        max_tokens=max_tokens,
        system=system or "",
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in resp.content if b.type == "text").strip()


# ---------------------------------------------------------------------------
# Public API used by the rest of the app
# ---------------------------------------------------------------------------


async def chat_completion(prompt: str, *, system: str | None = None,
                          max_tokens: int = 600, json_mode: bool = False) -> str:
    """Generic completion. Used by quiz generation, translation, etc.

    Returns the model output as a string. Raises on transport errors so the
    caller can decide whether to fall back to a deterministic alternative.
    """
    if settings.gemini_api_key:
        return await _gemini_generate(prompt, system=system, max_tokens=max_tokens, json_mode=json_mode)
    if settings.anthropic_api_key:
        return await _anthropic_generate(prompt, system=system, max_tokens=max_tokens)
    return ""


async def generate_answer(
    question: str,
    chunks: list[tuple[Chunk, float]],
    *,
    locale: str | None = None,
) -> str:
    user_msg = (
        f"Фрагменты базы знаний:\n\n{_build_context(chunks)}\n\n"
        f"Вопрос сотрудника: {question}"
    )
    system = _with_locale(SYSTEM_PROMPT, locale)
    if settings.gemini_api_key:
        try:
            text = await _gemini_generate(user_msg, system=system, max_tokens=600)
            if text:
                return text
        except Exception:
            log.exception("Gemini answer failed; falling back")
    if settings.anthropic_api_key:
        try:
            text = await _anthropic_generate(user_msg, system=system)
            if text:
                return text
        except Exception:
            log.exception("Anthropic answer failed; falling back")
    return _mock_answer(question, chunks)


async def stream_answer(
    question: str,
    chunks: list[tuple[Chunk, float]],
    *,
    locale: str | None = None,
) -> AsyncIterator[str]:
    user_msg = (
        f"Фрагменты базы знаний:\n\n{_build_context(chunks)}\n\n"
        f"Вопрос сотрудника: {question}"
    )
    system = _with_locale(SYSTEM_PROMPT, locale)
    if settings.gemini_api_key:
        try:
            async for chunk in _gemini_stream(user_msg, system=system):
                yield chunk
            return
        except Exception:
            log.exception("Gemini stream failed; falling back to single-shot mock")

    if settings.anthropic_api_key:
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=settings.anthropic_api_key)
            async with client.messages.stream(
                model=settings.llm_model,
                max_tokens=600,
                system=system,
                messages=[{"role": "user", "content": user_msg}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text
            return
        except Exception:
            log.exception("Anthropic stream failed")

    # Mock stream — emulate token-by-token for the UI cursor.
    text = _mock_answer(question, chunks)
    for word in text.split(" "):
        await asyncio.sleep(0.02)
        yield word + " "


# ---------------------------------------------------------------------------
# Translation
# ---------------------------------------------------------------------------


async def translate_text(text: str, *, target_lang: str) -> str:
    """Translate arbitrary text into ru / uz / en. Falls back to original
    string when no LLM provider is configured."""
    lang_label = {"ru": "русский", "uz": "узбекский (oʻzbekcha)", "en": "english"}.get(
        target_lang, target_lang
    )
    if not text.strip():
        return text
    if settings.llm_provider == "mock":
        return text
    prompt = (
        f"Переведи текст ниже на {lang_label}. Сохрани форматирование, "
        f"переноси Markdown как есть, не добавляй пояснений. Верни только перевод.\n\n"
        f"---\n{text}\n---"
    )
    try:
        out = await chat_completion(prompt, max_tokens=4096)
        return out.strip() or text
    except Exception:
        log.exception("translation failed; returning original text")
        return text


# ---------------------------------------------------------------------------
# HR Competency Assessment
# ---------------------------------------------------------------------------

COMPETENCY_SYSTEM = (
    "Ты — HR-аналитик платформы онбординга. На основе данных о прогрессе "
    "обучения сотрудника вынеси краткое суждение о его готовности к работе. "
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
        strengths.append("Активно использует AI-ассистента")
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
    if settings.llm_provider == "mock":
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
    user_msg = (
        "Данные по сотруднику (JSON):\n\n"
        + json.dumps(snapshot, ensure_ascii=False, indent=2)
        + "\n\nВыдай оценку строго по схеме."
    )
    try:
        text = await chat_completion(
            user_msg,
            system=COMPETENCY_SYSTEM,
            max_tokens=600,
            json_mode=True,
        )
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
