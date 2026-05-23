"""North — scenario-driven mascot bot.

Two surfaces:
  * ``/api/north/...``           — newcomer endpoints (read scenario, advance)
  * ``/api/admin/scenarios/...`` — Team Lead / admin scenario CRUD

A scenario has an ordered list of steps; each step is either a narrative,
a question (with optional choices and correct answer), or a content link to
an existing course/module. Progress is keyed per (user, scenario).
"""
from __future__ import annotations

import secrets
from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.agent import (
    AssessmentQuestion,
    evaluate_answers,
    generate_assessment,
    recommend_course,
)
from app.core.deps import current_user, require_role
from app.courses.catalog import list_courses
from app.db.activity import log_activity
from app.db.models import CourseProgress, CustomCourse, Scenario, User, UserScenarioProgress
from app.db.session import get_session


router = APIRouter(prefix="/north", tags=["north"])
admin_router = APIRouter(prefix="/admin/scenarios", tags=["north"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


NorthState = Literal[
    "idle", "thinking", "celebrating", "surprised", "waiting", "hyped", "listening"
]
InputType = Literal["text", "voice", "choice", "none"]


class ScenarioStep(BaseModel):
    """Permissive on extra fields so admins can stash hints / refs without a migration."""

    id: str = Field(min_length=1, max_length=64)
    order: int = 0
    north_message: str
    input_type: InputType = "none"
    choices: list[str] = []
    correct_answer: str | None = None
    north_state: NorthState = "waiting"
    on_complete_state: NorthState = "celebrating"
    content_ref: str | None = None


class ScenarioOut(BaseModel):
    id: int
    scenario_uid: str
    name: str
    department: str
    directions: list[str] = []
    assigned_user_id: int | None = None
    status: Literal["draft", "published"]
    steps: list[ScenarioStep]
    course_tags: list[str] = []
    created_at: datetime
    updated_at: datetime


class ScenarioCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    department: str = ""
    directions: list[str] = []
    assigned_user_id: int | None = None
    steps: list[ScenarioStep] = []
    course_tags: list[str] = []


class ScenarioUpdateRequest(BaseModel):
    name: str | None = None
    department: str | None = None
    directions: list[str] | None = None
    assigned_user_id: int | None = None
    steps: list[ScenarioStep] | None = None
    course_tags: list[str] | None = None


class ScenarioBuildRequest(BaseModel):
    """Free-form text (or transcribed voice) the admin sends; the LLM turns it
    into a structured scenario the editor can publish."""

    description: str = Field(min_length=4, max_length=8000)
    course_tags: list[str] = []
    name: str | None = None


class ScenarioPublishRequest(BaseModel):
    # Lets the admin UI flip the toggle either direction without two endpoints.
    status: Literal["draft", "published"]


class NorthProgressOut(BaseModel):
    scenario: ScenarioOut | None
    current_step: int
    total_steps: int
    completed: bool
    next_step: ScenarioStep | None


class NorthRespondRequest(BaseModel):
    response: str | None = None
    # The client must send the step id it just completed so we don't race a
    # second tab that already advanced the progress.
    step_id: str


class NorthNavigate(BaseModel):
    """Client-side navigation hint. The frontend executes the matching action
    when it sees this field on a response payload."""

    type: Literal["course", "url"]
    target: str
    label: str = ""


class NorthRespondOut(BaseModel):
    is_correct: bool | None
    next_step: ScenarioStep | None
    completed: bool
    current_step: int
    total_steps: int
    north_state: NorthState
    navigate: NorthNavigate | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _scenario_to_out(s: Scenario) -> ScenarioOut:
    # ``course_tags`` is stored as a plain attribute on the model if set; older
    # rows simply don't have it. Pull it off the JSON-ish steps payload as a
    # convenience for the admin UI.
    return ScenarioOut(
        id=s.id,
        scenario_uid=s.scenario_uid,
        name=s.name,
        department=s.department or "",
        directions=list(getattr(s, "directions", None) or []),
        assigned_user_id=getattr(s, "assigned_user_id", None),
        status=s.status or "draft",
        steps=[ScenarioStep.model_validate(step) for step in (s.steps or [])],
        course_tags=list(getattr(s, "course_tags", None) or []),
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


async def _pick_scenario_for_user(db: AsyncSession, user: User) -> Scenario | None:
    """Pick the scenario the user should run.

    Priority:
      1. A scenario explicitly bound to this user via ``assigned_user_id``
         (even if draft — assignments override visibility).
      2. A published scenario whose ``directions`` overlap with the user's.
      3. A published scenario whose legacy ``department`` matches.
      4. A general (department='') scenario as a fallback.
    """
    # 1. Direct assignment takes priority.
    assigned = await db.scalar(
        select(Scenario)
        .where(getattr(Scenario, "assigned_user_id", None) == user.id)
        .order_by(Scenario.updated_at.desc())
    )
    if assigned is not None:
        return assigned

    rows = (
        await db.scalars(
            select(Scenario).where(Scenario.status == "published").order_by(Scenario.updated_at.desc())
        )
    ).all()
    if not rows:
        return None

    user_dirs = {(d or "").strip().lower() for d in (user.directions or []) if d}
    dept = (user.department or "").strip().lower()
    if dept:
        user_dirs.add(dept)

    if user_dirs:
        for s in rows:
            s_dirs = {(d or "").strip().lower() for d in (s.directions or []) if d}
            if s_dirs and (s_dirs & user_dirs):
                return s
        for s in rows:
            if (s.department or "").strip().lower() in user_dirs:
                return s

    for s in rows:
        if not (s.department or "").strip() and not (s.directions or []):
            return s
    return rows[0]


def _progress_payload(scenario: Scenario | None, progress: UserScenarioProgress | None) -> NorthProgressOut:
    if not scenario:
        return NorthProgressOut(
            scenario=None,
            current_step=0,
            total_steps=0,
            completed=False,
            next_step=None,
        )
    steps = [ScenarioStep.model_validate(s) for s in (scenario.steps or [])]
    total = len(steps)
    cur = progress.current_step if progress else 0
    cur = max(0, min(cur, total))
    is_done = (progress.completed if progress else False) or total == 0
    return NorthProgressOut(
        scenario=_scenario_to_out(scenario),
        current_step=cur,
        total_steps=total,
        completed=is_done,
        next_step=steps[cur] if (cur < total and not is_done) else None,
    )


# ---------------------------------------------------------------------------
# Newcomer endpoints
# ---------------------------------------------------------------------------


@router.get("/scenario", response_model=ScenarioOut | None)
async def my_scenario(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    scenario = await _pick_scenario_for_user(db, user)
    return _scenario_to_out(scenario) if scenario else None


@router.get("/progress", response_model=NorthProgressOut)
async def my_progress(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    scenario = await _pick_scenario_for_user(db, user)
    if not scenario:
        return _progress_payload(None, None)
    progress = await db.scalar(
        select(UserScenarioProgress).where(
            and_(
                UserScenarioProgress.user_id == user.id,
                UserScenarioProgress.scenario_id == scenario.id,
            )
        )
    )
    return _progress_payload(scenario, progress)


@router.post("/progress", response_model=NorthProgressOut)
async def reset_progress(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Restart the scenario the user is currently on."""
    scenario = await _pick_scenario_for_user(db, user)
    if not scenario:
        return _progress_payload(None, None)
    progress = await db.scalar(
        select(UserScenarioProgress).where(
            and_(
                UserScenarioProgress.user_id == user.id,
                UserScenarioProgress.scenario_id == scenario.id,
            )
        )
    )
    if progress is None:
        progress = UserScenarioProgress(
            user_id=user.id, scenario_id=scenario.id, current_step=0, completed=False
        )
        db.add(progress)
    else:
        progress.current_step = 0
        progress.completed = False
        progress.completed_at = None
    await db.commit()
    await db.refresh(progress)
    return _progress_payload(scenario, progress)


@router.post("/respond", response_model=NorthRespondOut)
async def respond(
    payload: NorthRespondRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Process the user's response to the current step.

    Logic:
      1. Look up the user's current scenario + progress (create if absent).
      2. Validate that the step the client thinks it's on matches the server.
         If they're out of sync (e.g. another tab advanced already) we don't
         double-advance — we just return the actual server state.
      3. If ``correct_answer`` is set on the step, compare it with the
         caller's response (trimmed, case-insensitive). For ``choice`` we
         expect the chosen label.
      4. Only advance the step pointer when the answer is correct (or when
         no correct answer is required — narrative / "none" steps).
      5. Return the next step and the mascot state to display.
    """
    scenario = await _pick_scenario_for_user(db, user)
    if not scenario:
        raise HTTPException(404, "Сценарий не найден")
    steps = [ScenarioStep.model_validate(s) for s in (scenario.steps or [])]
    total = len(steps)

    progress = await db.scalar(
        select(UserScenarioProgress).where(
            and_(
                UserScenarioProgress.user_id == user.id,
                UserScenarioProgress.scenario_id == scenario.id,
            )
        )
    )
    if progress is None:
        progress = UserScenarioProgress(
            user_id=user.id, scenario_id=scenario.id, current_step=0, completed=False
        )
        db.add(progress)
        await db.flush()

    if progress.completed or progress.current_step >= total:
        return NorthRespondOut(
            is_correct=None,
            next_step=None,
            completed=True,
            current_step=total,
            total_steps=total,
            north_state="celebrating",
        )

    current = steps[progress.current_step]
    if current.id != payload.step_id:
        # Out of sync — refuse to advance, just report the actual state.
        return NorthRespondOut(
            is_correct=None,
            next_step=current,
            completed=False,
            current_step=progress.current_step,
            total_steps=total,
            north_state=current.north_state,
        )

    is_correct: bool | None = None
    if current.correct_answer is not None:
        expected = current.correct_answer.strip().lower()
        got = (payload.response or "").strip().lower()
        is_correct = expected == got
        if not is_correct:
            return NorthRespondOut(
                is_correct=False,
                next_step=current,
                completed=False,
                current_step=progress.current_step,
                total_steps=total,
                north_state="surprised",
            )

    progress.current_step += 1
    if progress.current_step >= total:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        await log_activity(
            db,
            user_id=user.id,
            kind="north_scenario_completed",
            title=f"Сценарий с Норсом «{scenario.name}» завершён",
            detail=f"steps={total}",
        )

    await db.commit()
    await db.refresh(progress)

    next_step = steps[progress.current_step] if progress.current_step < total else None

    # If the step the user just finished pointed at a specific course, ride
    # that through to the client as a navigate hint. North's frontend hook
    # consumes ``navigate`` and routes the user there with a tiny delay so the
    # celebrate animation gets to play first.
    navigate: NorthNavigate | None = None
    if current.content_ref:
        navigate = NorthNavigate(
            type="course",
            target=current.content_ref,
            label=current.content_ref,
        )

    return NorthRespondOut(
        is_correct=is_correct,
        next_step=next_step,
        completed=progress.completed,
        current_step=progress.current_step,
        total_steps=total,
        north_state="celebrating" if (is_correct or next_step is None) else (next_step.north_state if next_step else "idle"),
        navigate=navigate,
    )


# ---------------------------------------------------------------------------
# Admin CRUD
# ---------------------------------------------------------------------------


def _ensure_role(user: User) -> None:
    if user.role not in ("admin", "hr"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Только админ или HR")


@admin_router.get("", response_model=list[ScenarioOut], dependencies=[Depends(require_role("admin", "hr"))])
async def list_scenarios(db: AsyncSession = Depends(get_session)):
    rows = (
        await db.scalars(select(Scenario).order_by(Scenario.updated_at.desc()))
    ).all()
    return [_scenario_to_out(s) for s in rows]


@admin_router.post(
    "",
    response_model=ScenarioOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def create_scenario(
    payload: ScenarioCreateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    uid = f"sc-{int(datetime.utcnow().timestamp())}-{secrets.token_hex(3)}"
    scenario = Scenario(
        scenario_uid=uid,
        name=payload.name,
        department=payload.department,
        directions=payload.directions,
        assigned_user_id=payload.assigned_user_id,
        steps=[s.model_dump() for s in payload.steps],
        course_tags=payload.course_tags,
        status="draft",
        created_by=user.id,
    )
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)
    return _scenario_to_out(scenario)


@admin_router.put(
    "/{scenario_id}",
    response_model=ScenarioOut,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def update_scenario(
    scenario_id: int,
    payload: ScenarioUpdateRequest,
    db: AsyncSession = Depends(get_session),
):
    scenario = await db.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(404, "Сценарий не найден")
    if payload.name is not None:
        scenario.name = payload.name
    if payload.department is not None:
        scenario.department = payload.department
    if payload.directions is not None:
        scenario.directions = payload.directions
    if payload.assigned_user_id is not None:
        scenario.assigned_user_id = payload.assigned_user_id or None
    if payload.steps is not None:
        scenario.steps = [s.model_dump() for s in payload.steps]
    if payload.course_tags is not None:
        scenario.course_tags = payload.course_tags
    await db.commit()
    await db.refresh(scenario)
    return _scenario_to_out(scenario)


@admin_router.delete(
    "/{scenario_id}",
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def delete_scenario(
    scenario_id: int,
    db: AsyncSession = Depends(get_session),
):
    scenario = await db.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(404, "Сценарий не найден")
    await db.delete(scenario)
    await db.commit()
    return {"deleted": True}


@admin_router.patch(
    "/{scenario_id}/publish",
    response_model=ScenarioOut,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def publish_scenario(
    scenario_id: int,
    payload: ScenarioPublishRequest,
    db: AsyncSession = Depends(get_session),
):
    scenario = await db.get(Scenario, scenario_id)
    if not scenario:
        raise HTTPException(404, "Сценарий не найден")
    scenario.status = payload.status
    await db.commit()
    await db.refresh(scenario)
    return _scenario_to_out(scenario)


# ---------------------------------------------------------------------------
# Assessment flow ("North runs a skill check after login, then recommends a
# course to close the gaps")
# ---------------------------------------------------------------------------


class AssessmentStartOut(BaseModel):
    questions: list[dict]
    intro: str


class AssessmentSubmitRequest(BaseModel):
    questions: list[dict]
    answers: dict[str, str]
    locale: str | None = None


class AssessmentSubmitOut(BaseModel):
    score: int
    max: int
    correct_pct: int
    gaps: list[str]
    message: str
    recommended_course: dict | None
    navigate: NorthNavigate | None


async def _user_catalog(db: AsyncSession, user: User) -> list[dict]:
    """Return the user's course catalog the same shape the recommender expects."""
    out: list[dict] = []
    # Built-in courses.
    for c in list_courses():
        out.append(
            {
                "slug": c["slug"],
                "title": c["title"],
                "subtitle": c.get("subtitle", ""),
                "description": c.get("description", ""),
                "tags": c.get("tags", []),
                "lessons_completed": 0,
                "completed": False,
            }
        )
    # Custom (admin-built) courses.
    rows = (await db.scalars(select(CustomCourse))).all()
    for r in rows:
        out.append(
            {
                "slug": r.slug,
                "title": r.title,
                "subtitle": r.subtitle or "",
                "description": r.description or "",
                "tags": r.tags or [],
                "lessons_completed": 0,
                "completed": False,
            }
        )
    # Overlay this user's progress so the recommender knows what's in-flight.
    progress_rows = (
        await db.scalars(
            select(CourseProgress).where(CourseProgress.user_id == user.id)
        )
    ).all()
    pmap = {p.course_slug: p for p in progress_rows}
    for course in out:
        p = pmap.get(course["slug"])
        if p:
            course["completed"] = p.completed_at is not None
            course["lessons_completed"] = 1  # signal "in progress"
    return out


@router.post("/assess/start", response_model=AssessmentStartOut)
async def assess_start(
    locale: str | None = None,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Generate a fresh skill-check tailored to the user. The frontend should
    keep the questions in memory and POST them back to /assess/submit together
    with the answers so the backend can score without a DB round-trip."""
    from app.ai.llm import translate_text

    ctx = {
        "full_name": user.full_name,
        "job_title": user.job_title or "",
        "department": user.department or "",
        "program": user.program or "",
        "position": user.position or "",
    }
    qs = await generate_assessment(user_context=ctx, count=4)
    intro = (
        f"Привет, {user.full_name.split()[0] if user.full_name else 'друг'}! "
        "Я Норс. Давай быстренько проверим, что уже на месте, "
        "чтобы я подобрал курс под твой уровень."
    )
    questions_out = [q.as_dict() for q in qs]
    if locale and locale != "ru":
        intro = await translate_text(intro, target_lang=locale)
        # Translate the visible question + option text so the picker shows in
        # the user's UI language. correct_option_id stays the same so scoring
        # still works on the round trip.
        for q in questions_out:
            q["question"] = await translate_text(q.get("question", ""), target_lang=locale)
            for opt in q.get("options") or []:
                opt["text"] = await translate_text(opt.get("text", ""), target_lang=locale)
    return AssessmentStartOut(
        questions=questions_out,
        intro=intro,
    )


@router.post("/assess/submit", response_model=AssessmentSubmitOut)
async def assess_submit(
    payload: AssessmentSubmitRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    # Re-hydrate the questions the client sent us so we can re-use evaluator.
    questions = [
        AssessmentQuestion(
            id=str(q.get("id") or ""),
            question=str(q.get("question") or ""),
            options=q.get("options") or [],
            correct_option_id=str(q.get("correct_option_id") or ""),
            topic=str(q.get("topic") or "general"),
            rationale=str(q.get("rationale") or ""),
        )
        for q in payload.questions
        if isinstance(q, dict)
    ]
    if not questions:
        raise HTTPException(400, "Нет вопросов для оценки")

    result = evaluate_answers(questions, payload.answers)
    ctx = {
        "job_title": user.job_title or "",
        "department": user.department or "",
        "program": user.program or "",
        "position": user.position or "",
    }
    catalog = await _user_catalog(db, user)
    recommended = await recommend_course(
        gaps=result["gaps"], user_context=ctx, catalog=catalog
    )

    navigate = None
    if recommended:
        navigate = NorthNavigate(
            type="course",
            target=recommended["slug"],
            label=recommended["title"],
        )

    # Build the post-assessment message — North speaks to the user directly.
    if result["correct_pct"] >= 80:
        tone = "Сильное начало!"
    elif result["correct_pct"] >= 50:
        tone = "Хороший старт, есть что подтянуть."
    else:
        tone = "Не волнуйся — мы знаем, с чего начать."
    if recommended:
        message = (
            f"{tone} {result['score']} из {result['max']} верно. "
            f"Закроем пробелы курсом «{recommended['title']}» — я открою его прямо сейчас."
        )
    else:
        message = (
            f"{tone} {result['score']} из {result['max']} верно. "
            "Я не нашёл курс под твои пробелы — заглядывай в каталог."
        )

    await log_activity(
        db,
        user_id=user.id,
        kind="north_assessment_completed",
        title="Норс провёл мини-тест",
        detail=f"score={result['score']}/{result['max']}, gaps={','.join(result['gaps'])}",
    )
    await db.commit()

    if payload.locale and payload.locale != "ru":
        from app.ai.llm import translate_text

        message = await translate_text(message, target_lang=payload.locale)

    return AssessmentSubmitOut(
        score=result["score"],
        max=result["max"],
        correct_pct=result["correct_pct"],
        gaps=result["gaps"],
        message=message,
        recommended_course={
            "slug": recommended["slug"],
            "title": recommended["title"],
        } if recommended else None,
        navigate=navigate,
    )


# ---------------------------------------------------------------------------
# AI scenario builder — admin posts free-form text, gets back a draft scenario.
# ---------------------------------------------------------------------------


def _rule_based_scenario(description: str, course_tags: list[str], name: str | None) -> dict:
    """Deterministic fallback for when no LLM is configured. Splits the
    description into sentence-sized steps so the admin still gets a usable
    skeleton they can edit."""
    import re as _re

    cleaned = _re.sub(r"\s+", " ", description).strip()
    sentences = [s.strip() for s in _re.split(r"(?<=[.!?])\s+", cleaned) if s.strip()]
    if not sentences:
        sentences = [cleaned or "Скажи что-то новенькое, {name}!"]
    steps: list[dict] = []
    for i, s in enumerate(sentences[:8]):
        steps.append(
            {
                "id": f"s{i + 1}",
                "order": i,
                "north_message": s,
                "input_type": "none",
                "choices": [],
                "correct_answer": None,
                "north_state": "waiting" if i > 0 else "hyped",
                "on_complete_state": "celebrating",
                "content_ref": course_tags[0] if (i == len(sentences) - 1 and course_tags) else None,
            }
        )
    return {
        "name": name or (sentences[0][:48] if sentences else "Новый сценарий"),
        "steps": steps,
    }


@admin_router.post(
    "/build",
    response_model=ScenarioOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def build_scenario(
    payload: ScenarioBuildRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Build a draft scenario from a free-form description (text or voice
    transcript). Uses the LLM when configured; falls back to a deterministic
    splitter otherwise."""
    from app.ai.llm import chat_completion  # local to avoid cycles
    from app.core.config import settings as cfg

    built: dict
    if cfg.llm_provider != "mock":
        import json as _json

        prompt = (
            "Ты — методист онбординга. По описанию ниже собери сценарий, по "
            "которому маскот Норс ведёт новичка. Верни строго JSON следующей "
            "формы:\n"
            '{"name": "...", "steps": [{"id": "s1", "order": 0, "north_message": "Привет, {name}!", '
            '"input_type": "none|text|choice", "choices": ["..."], "correct_answer": null, '
            '"north_state": "idle|thinking|waiting|listening|hyped|celebrating|surprised", '
            '"on_complete_state": "celebrating", "content_ref": null}]}\n'
            "Правила: 3–7 шагов; {name} подставится автоматически; для шагов "
            "с вариантами заполни choices и correct_answer; для перехода к курсу "
            "из тегов укажи его slug в content_ref. Никакого markdown — только JSON.\n\n"
            f"Описание: {payload.description}\n"
            f"Связанные курсы (slug): {', '.join(payload.course_tags) or '—'}"
        )
        try:
            raw = await chat_completion(prompt)
            # Strip code fences if the model added them.
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:]
            data = _json.loads(cleaned)
            if not isinstance(data, dict) or not isinstance(data.get("steps"), list):
                raise ValueError("bad shape")
            built = data
            if payload.name and not built.get("name"):
                built["name"] = payload.name
        except Exception:
            built = _rule_based_scenario(payload.description, payload.course_tags, payload.name)
    else:
        built = _rule_based_scenario(payload.description, payload.course_tags, payload.name)

    # Validate / coerce steps via the existing pydantic model.
    safe_steps: list[ScenarioStep] = []
    for i, step in enumerate(built.get("steps") or []):
        if not isinstance(step, dict):
            continue
        step.setdefault("id", f"s{i + 1}")
        step.setdefault("order", i)
        try:
            safe_steps.append(ScenarioStep.model_validate(step))
        except Exception:
            continue
    if not safe_steps:
        # As a last resort, fall back to the rule-based skeleton.
        built = _rule_based_scenario(payload.description, payload.course_tags, payload.name)
        safe_steps = [ScenarioStep.model_validate(s) for s in built["steps"]]

    uid = f"sc-{int(datetime.utcnow().timestamp())}-{secrets.token_hex(3)}"
    scenario = Scenario(
        scenario_uid=uid,
        name=built.get("name") or payload.name or "Новый сценарий",
        department="",
        directions=[],
        course_tags=list(payload.course_tags or []),
        steps=[s.model_dump() for s in safe_steps],
        status="draft",
        created_by=user.id,
    )
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)
    return _scenario_to_out(scenario)
