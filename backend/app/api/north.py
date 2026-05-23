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

from app.core.deps import current_user, require_role
from app.db.activity import log_activity
from app.db.models import Scenario, User, UserScenarioProgress
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
    status: Literal["draft", "published"]
    steps: list[ScenarioStep]
    created_at: datetime
    updated_at: datetime


class ScenarioCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    department: str = ""
    steps: list[ScenarioStep] = []


class ScenarioUpdateRequest(BaseModel):
    name: str | None = None
    department: str | None = None
    steps: list[ScenarioStep] | None = None


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


class NorthRespondOut(BaseModel):
    is_correct: bool | None
    next_step: ScenarioStep | None
    completed: bool
    current_step: int
    total_steps: int
    north_state: NorthState


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _scenario_to_out(s: Scenario) -> ScenarioOut:
    return ScenarioOut(
        id=s.id,
        scenario_uid=s.scenario_uid,
        name=s.name,
        department=s.department or "",
        status=s.status or "draft",
        steps=[ScenarioStep.model_validate(step) for step in (s.steps or [])],
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


async def _pick_scenario_for_user(db: AsyncSession, user: User) -> Scenario | None:
    """Pick the published scenario for the user's department, falling back to
    a general (department='') scenario if nothing matches exactly."""
    rows = (
        await db.scalars(
            select(Scenario).where(Scenario.status == "published").order_by(Scenario.updated_at.desc())
        )
    ).all()
    if not rows:
        return None
    dept = (user.department or "").strip().lower()
    if dept:
        for s in rows:
            if (s.department or "").strip().lower() == dept:
                return s
    for s in rows:
        if not (s.department or "").strip():
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
    return NorthRespondOut(
        is_correct=is_correct,
        next_step=next_step,
        completed=progress.completed,
        current_step=progress.current_step,
        total_steps=total,
        north_state="celebrating" if (is_correct or next_step is None) else (next_step.north_state if next_step else "idle"),
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
        steps=[s.model_dump() for s in payload.steps],
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
    if payload.steps is not None:
        scenario.steps = [s.model_dump() for s in payload.steps]
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
