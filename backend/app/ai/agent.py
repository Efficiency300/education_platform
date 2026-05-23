"""LangGraph agent that drives both the AI assistant and the North mascot.

The agent runs on Gemini (via ``langchain-google-genai``) and exposes a small
set of tools the model can call:

  * ``rag_search(query)`` — search the knowledge base, return cited snippets
  * ``generate_assessment(topics)`` — produce a short skill-check quiz
  * ``evaluate_answers(questions, answers)`` — score answers, surface gaps
  * ``recommend_course(gaps, user_context)`` — pick the best course slug for the
    current user given their identified gaps
  * ``navigate(course_slug)`` — emit a navigation hint the frontend acts on

The same agent is used by:

  * the AI chat endpoint — single-turn Q&A with RAG grounding
  * the North mascot — for the *assessment* flow (initial skill check) and as
    a general reasoning loop for "where should this newcomer go next"

When neither Gemini nor Anthropic is configured, the helper functions in this
module degrade gracefully: ``assessment``/``recommend`` fall back to a
deterministic, rule-based path, and the agent itself isn't constructed.
"""
from __future__ import annotations

import json
import logging
import re
import secrets
from dataclasses import dataclass
from typing import Any, Iterable

from app.ai.rag import Chunk, rag_index
from app.ai.vector_store import VectorHit, vector_store
from app.core.config import settings


log = logging.getLogger("app.agent")


# ---------------------------------------------------------------------------
# Configuration helpers
# ---------------------------------------------------------------------------


def _build_llm():
    """Return a configured chat model, or ``None`` if no provider is available.

    LangGraph and ``langchain-google-genai`` are imported lazily so the rest of
    the app still boots when they aren't installed (mock mode for dev).
    """
    if not settings.gemini_api_key:
        return None
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except Exception:  # pragma: no cover — missing dep
        log.warning("langchain-google-genai not installed; agent unavailable")
        return None
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=0.4,
        convert_system_message_to_human=True,
    )


# ---------------------------------------------------------------------------
# Tool implementations (also usable directly, not just from the agent)
# ---------------------------------------------------------------------------


@dataclass
class AssessmentQuestion:
    id: str
    question: str
    options: list[dict[str, str]]   # [{"id":"a","text":"..."}]
    correct_option_id: str
    topic: str
    rationale: str = ""

    def as_dict(self) -> dict:
        return {
            "id": self.id,
            "question": self.question,
            "options": self.options,
            "correct_option_id": self.correct_option_id,
            "topic": self.topic,
            "rationale": self.rationale,
        }


# -- assessment generator -----------------------------------------------------


ASSESSMENT_SYSTEM = (
    "Ты — North, маскот-проводник по платформе онбординга. Сгенерируй "
    "короткий проверочный тест (3-5 вопросов с одним правильным ответом) по "
    "темам, относящимся к роли пользователя. Вопросы должны быть короткими и "
    "практическими. Возвращай СТРОГО валидный JSON-массив в формате:\n"
    '[{"id":"q1","topic":"...","question":"...",'
    '"options":[{"id":"a","text":"..."},{"id":"b","text":"..."},'
    '{"id":"c","text":"..."}],"correct_option_id":"a",'
    '"rationale":"короткое пояснение"}]'
)


def _rule_based_assessment(topics: list[str], count: int = 4) -> list[AssessmentQuestion]:
    """Fallback when no LLM is available. Builds generic onboarding questions
    so the experience still works in mock mode."""
    pool = [
        AssessmentQuestion(
            id="q1",
            topic=topics[0] if topics else "platform",
            question="Где у нас живут учебные курсы?",
            options=[
                {"id": "a", "text": "В разделе «Курсы»"},
                {"id": "b", "text": "В групповом чате"},
                {"id": "c", "text": "В файлах"},
            ],
            correct_option_id="a",
            rationale="Все курсы в разделе «Курсы».",
        ),
        AssessmentQuestion(
            id="q2",
            topic=topics[0] if topics else "communication",
            question="Куда отнести рабочий вопрос к старшим коллегам?",
            options=[
                {"id": "a", "text": "Команды (групповой чат)"},
                {"id": "b", "text": "Симулятор"},
                {"id": "c", "text": "Лидерборд"},
            ],
            correct_option_id="a",
            rationale="Группы и есть про обмен опытом.",
        ),
        AssessmentQuestion(
            id="q3",
            topic=topics[0] if topics else "knowledge",
            question="Что использует AI-ассистент для ответов?",
            options=[
                {"id": "a", "text": "Документы из «Файлов» и базы знаний"},
                {"id": "b", "text": "Случайные источники из интернета"},
                {"id": "c", "text": "Личные сообщения сотрудников"},
            ],
            correct_option_id="a",
            rationale="Ассистент строго ограничен базой знаний компании.",
        ),
    ]
    return pool[: max(1, min(count, len(pool)))]


async def generate_assessment(
    *,
    user_context: dict,
    count: int = 4,
) -> list[AssessmentQuestion]:
    """Generate a short skill-check tailored to the user.

    ``user_context`` should include at least ``department`` and ``job_title``
    so the LLM can pick relevant topics. We also pass any tags / programs the
    user is currently assigned to.
    """
    topics = [
        t
        for t in [
            (user_context.get("job_title") or "").strip(),
            (user_context.get("department") or "").strip(),
            (user_context.get("program") or "").strip(),
        ]
        if t
    ]

    llm = _build_llm()
    if llm is None:
        return _rule_based_assessment(topics, count=count)

    try:
        prompt = (
            f"Профиль пользователя: {json.dumps(user_context, ensure_ascii=False)}.\n"
            f"Сгенерируй {count} вопросов по основным темам этой роли.\n"
            "Верни JSON-массив без обрамления."
        )
        from langchain_core.messages import HumanMessage, SystemMessage

        result = await llm.ainvoke([
            SystemMessage(content=ASSESSMENT_SYSTEM),
            HumanMessage(content=prompt),
        ])
        text = result.content if isinstance(result.content, str) else str(result.content)
        return _parse_assessment_payload(text, topics, count)
    except Exception:
        log.exception("Gemini assessment failed; falling back to rule-based path")
        return _rule_based_assessment(topics, count=count)


def _parse_assessment_payload(
    text: str, topics: list[str], count: int
) -> list[AssessmentQuestion]:
    """Parse the model output into ``AssessmentQuestion`` objects. The model is
    asked for a JSON array, but real-world outputs often include code fences
    or stray prose around it, so we strip that first."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-z]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        data = json.loads(cleaned)
    except Exception:
        match = re.search(r"\[.*\]", cleaned, flags=re.S)
        if not match:
            return _rule_based_assessment(topics, count=count)
        try:
            data = json.loads(match.group(0))
        except Exception:
            return _rule_based_assessment(topics, count=count)

    if not isinstance(data, list):
        return _rule_based_assessment(topics, count=count)

    out: list[AssessmentQuestion] = []
    for i, raw in enumerate(data[:count]):
        if not isinstance(raw, dict):
            continue
        opts_in = raw.get("options") or []
        options: list[dict[str, str]] = []
        for j, o in enumerate(opts_in):
            if not isinstance(o, dict):
                continue
            options.append(
                {
                    "id": str(o.get("id") or chr(ord("a") + j))[:2],
                    "text": str(o.get("text") or "").strip()[:240],
                }
            )
        if not options:
            continue
        correct = str(raw.get("correct_option_id") or options[0]["id"])
        if not any(o["id"] == correct for o in options):
            correct = options[0]["id"]
        out.append(
            AssessmentQuestion(
                id=str(raw.get("id") or f"q{i + 1}")[:8],
                question=str(raw.get("question") or "").strip()[:500],
                options=options,
                correct_option_id=correct,
                topic=str(raw.get("topic") or (topics[0] if topics else "general"))[:64],
                rationale=str(raw.get("rationale") or "")[:400],
            )
        )
    return out or _rule_based_assessment(topics, count=count)


# -- evaluator ---------------------------------------------------------------


def evaluate_answers(
    questions: list[AssessmentQuestion], answers: dict[str, str]
) -> dict[str, Any]:
    """Score the user's answers and surface the topics they got wrong.

    Returns ``{"score": int, "max": int, "correct_pct": int, "gaps": [topic, ...]}``.
    Gaps are deduplicated and ordered by frequency.
    """
    total = len(questions)
    if total == 0:
        return {"score": 0, "max": 0, "correct_pct": 0, "gaps": []}
    correct = 0
    gap_topics: dict[str, int] = {}
    for q in questions:
        got = (answers.get(q.id) or "").strip().lower()
        expected = q.correct_option_id.strip().lower()
        if got == expected:
            correct += 1
        else:
            gap_topics[q.topic] = gap_topics.get(q.topic, 0) + 1
    pct = int(round((correct / total) * 100))
    gaps = [t for t, _ in sorted(gap_topics.items(), key=lambda kv: -kv[1])]
    return {"score": correct, "max": total, "correct_pct": pct, "gaps": gaps}


# -- recommender -------------------------------------------------------------


async def recommend_course(
    *,
    gaps: Iterable[str],
    user_context: dict,
    catalog: list[dict],
) -> dict | None:
    """Pick the course that best closes the user's gaps.

    ``catalog`` is the list of available courses (slug, title, description,
    tags). The scoring is the same heuristic we use on the dashboard
    recommendation card so the two surfaces stay in sync.
    """
    if not catalog:
        return None

    signal = {
        t.lower()
        for t in [
            *gaps,
            (user_context.get("job_title") or "").lower(),
            (user_context.get("department") or "").lower(),
            (user_context.get("program") or "").lower(),
        ]
        if t
    }

    def tokens(text: str) -> set[str]:
        return {tok for tok in re.split(r"[\s,/_\-+()]+", (text or "").lower()) if len(tok) >= 3}

    best: tuple[int, dict] | None = None
    for course in catalog:
        haystack: set[str] = set()
        haystack.update((course.get("tags") or []))
        haystack.update(tokens(course.get("title") or ""))
        haystack.update(tokens(course.get("subtitle") or ""))
        haystack.update(tokens(course.get("description") or ""))
        haystack.update(tokens(course.get("slug") or ""))
        haystack = {h.lower() for h in haystack}
        score = sum(3 for tok in signal if tok in haystack)
        if not course.get("completed"):
            score += 1
        if course.get("lessons_completed", 0) > 0 and not course.get("completed"):
            score += 2
        if best is None or score > best[0]:
            best = (score, course)
    if best is None or best[0] <= 0:
        # Nothing matched the signal — fall back to the first in-progress course
        # (or the first un-completed one).
        for course in catalog:
            if course.get("lessons_completed", 0) > 0 and not course.get("completed"):
                return course
        for course in catalog:
            if not course.get("completed"):
                return course
        return catalog[0]
    return best[1]


# ---------------------------------------------------------------------------
# RAG-grounded answer (used by the AI assistant)
# ---------------------------------------------------------------------------


ASSISTANT_SYSTEM = (
    "Ты — AI-ассистент онбординг-платформы. Помогай пользователю с любыми "
    "рабочими и учебными вопросами: программированием, фреймворками, "
    "процессами, общими IT-темами и внутренними регламентами.\n\n"
    "Как отвечать:\n"
    "1. Если в предоставленных фрагментах базы знаний есть релевантная "
    "информация — приоритетно опирайся на неё и старайся отвечать в её "
    "терминах.\n"
    "2. Если в базе знаний ответа нет, но вопрос общий (например про "
    "FastAPI, Python, SQL, Git и т.п.) — отвечай из своих общих знаний и "
    "коротко отметь, что во внутренней документации это не описано.\n"
    "3. Никогда не отказывайся помочь по технической или рабочей теме, "
    "ссылаясь только на отсутствие данных в базе знаний. Отказ уместен "
    "только если тема явно вне твоей компетенции (например личные "
    "данные коллег, юридические/медицинские вопросы) — тогда предложи "
    "обратиться к наставнику или HR.\n"
    "4. Отвечай по делу: 3-8 предложений, без воды. Если уместен код — "
    "приведи минимальный пример в Markdown.\n"
    "5. Источники не перечисляй в тексте — они приходят отдельным каналом."
)


def _build_context(chunks: list[tuple[Chunk, float]]) -> str:
    if not chunks:
        return "(нет релевантных фрагментов)"
    return "\n\n".join(
        f"[Источник {i + 1}: {c.doc_title}]\n{c.text}" for i, (c, _) in enumerate(chunks)
    )


def _vector_hits_to_chunks(hits: list[VectorHit]) -> list[tuple[Chunk, float]]:
    """Reshape Qdrant hits into the (Chunk, score) tuples the rest of the app
    already understands. Keeps the chat / source UI untouched."""
    return [
        (
            Chunk(doc_title=h.title or h.filename, text=h.text, source_path=h.filename),
            h.score,
        )
        for h in hits
    ]


async def hybrid_retrieve(
    question: str,
    *,
    top_k: int = 4,
    direction: str | None = None,
) -> list[tuple[Chunk, float]]:
    """Try Qdrant first; if it's disabled or returns nothing, fall back to
    BM25 over the local markdown corpus. Both surfaces (assistant + North)
    use this so retrieval behaviour stays consistent."""
    if vector_store.is_enabled():
        try:
            hits = await vector_store.search(question, top_k=top_k, direction=direction)
        except Exception:
            hits = []
        if hits:
            return _vector_hits_to_chunks(hits)
    return rag_index.search(question, top_k=top_k)


_LANG_LABEL = {
    "ru": "русском",
    "uz": "узбекском (oʻzbekcha, латиница)",
    "en": "английском",
}


def _system_with_locale(system: str, locale: str | None) -> str:
    label = _LANG_LABEL.get((locale or "").lower())
    if not label:
        return system
    return (
        f"{system}\n\nВАЖНО: отвечай строго на {label} языке, "
        "даже если вопрос или фрагменты базы знаний на другом языке."
    )


async def agent_answer(
    question: str,
    top_k: int = 4,
    *,
    direction: str | None = None,
    locale: str | None = None,
) -> tuple[str, list[tuple[Chunk, float]]]:
    """Single-turn RAG answer. Used by the AI assistant chat.

    Returns the (answer, sources) pair so the caller can stream the text and
    surface the source list to the user in one go.
    """
    hits = await hybrid_retrieve(question, top_k=top_k, direction=direction)
    llm = _build_llm()
    if llm is None:
        # Mock path — keep parity with the previous "mock answer" behaviour
        # so the chat doesn't die when the platform is in offline mode.
        from app.ai.llm import generate_answer
        text = await generate_answer(question, hits, locale=locale)
        return text, hits
    try:
        from langchain_core.messages import HumanMessage, SystemMessage

        msg = (
            f"Фрагменты базы знаний:\n\n{_build_context(hits)}\n\n"
            f"Вопрос: {question}"
        )
        result = await llm.ainvoke([
            SystemMessage(content=_system_with_locale(ASSISTANT_SYSTEM, locale)),
            HumanMessage(content=msg),
        ])
        text = result.content if isinstance(result.content, str) else str(result.content)
        return text.strip(), hits
    except Exception:
        log.exception("Gemini assistant call failed; falling back to mock")
        from app.ai.llm import generate_answer
        text = await generate_answer(question, hits, locale=locale)
        return text, hits


def new_question_id() -> str:
    return "q-" + secrets.token_hex(3)
