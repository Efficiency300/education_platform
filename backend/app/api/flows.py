"""Норс — guided onboarding flow.

Endpoints (`/api/flows/...` for self-service, `/api/admin/flows/...` for admin):

  GET    /flows                 — list flows visible to the current user
  GET    /flows/me              — the user's "current" flow + progress
  POST   /flows/me/start        — start (or restart) the given flow
  POST   /flows/me/advance      — move one step forward, optionally with answer
  POST   /flows/me/reset        — clear progress

  GET    /admin/flows           — admin: list every flow
  POST   /admin/flows           — admin: create
  PUT    /admin/flows/{id}      — admin: update
  DELETE /admin/flows/{id}      — admin: delete
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user, require_role
from app.db.activity import log_activity
from app.db.models import OnboardingFlow, User, UserFlowProgress
from app.db.session import get_session


router = APIRouter(tags=["flows"])
admin_router = APIRouter(prefix="/admin/flows", tags=["flows"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class FlowOption(BaseModel):
    id: str
    label: str


class FlowStep(BaseModel):
    """One step in a flow. We keep the shape permissive on purpose so admins
    can store extra metadata (e.g. ``hint`` text or ``course_slug``) without a
    schema migration."""

    id: str = Field(min_length=1, max_length=64)
    kind: Literal["narrative", "question", "course"] = "narrative"
    text: str
    options: list[FlowOption] = []
    correct_option_id: str | None = None
    course_slug: str | None = None
    hint: str = ""


class FlowOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    department: str
    steps: list[FlowStep]
    updated_at: datetime


class FlowCreateRequest(BaseModel):
    slug: str = Field(min_length=2, max_length=128, pattern=r"^[a-z0-9_\-]+$")
    name: str = Field(min_length=2, max_length=255)
    description: str = ""
    department: str = ""
    steps: list[FlowStep] = []


class FlowUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    department: str | None = None
    steps: list[FlowStep] | None = None


class FlowProgressOut(BaseModel):
    flow: FlowOut | None
    current_step: int
    total_steps: int
    is_completed: bool
    next_step: FlowStep | None
    answers: dict[str, Any]


class AdvanceRequest(BaseModel):
    flow_id: int
    # Optional answer payload for the step the user just finished. We don't
    # validate against the step here — every step type stores the answer the
    # same way, and the client decides whether to send one.
    answer: dict[str, Any] | None = None


class StartRequest(BaseModel):
    flow_id: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _flow_to_out(flow: OnboardingFlow) -> FlowOut:
    return FlowOut(
        id=flow.id,
        slug=flow.slug,
        name=flow.name,
        description=flow.description or "",
        department=flow.department or "",
        steps=[FlowStep.model_validate(s) for s in (flow.steps or [])],
        updated_at=flow.updated_at,
    )


async def _flow_for_user(db: AsyncSession, user: User) -> OnboardingFlow | None:
    """Pick the flow that best matches the user. Prefers an exact department
    match; falls back to the empty-department "general" flow."""
    rows = (await db.scalars(select(OnboardingFlow).order_by(OnboardingFlow.id))).all()
    if not rows:
        return None
    user_dept = (user.department or "").strip().lower()
    if user_dept:
        for f in rows:
            if (f.department or "").strip().lower() == user_dept:
                return f
    for f in rows:
        if not (f.department or "").strip():
            return f
    return rows[0]


def _progress_payload(
    flow: OnboardingFlow | None, progress: UserFlowProgress | None
) -> FlowProgressOut:
    if not flow:
        return FlowProgressOut(
            flow=None,
            current_step=0,
            total_steps=0,
            is_completed=False,
            next_step=None,
            answers={},
        )
    steps = [FlowStep.model_validate(s) for s in (flow.steps or [])]
    total = len(steps)
    cur = progress.current_step if progress else 0
    cur = max(0, min(cur, total))
    completed = (progress.completed_at is not None) if progress else (total == 0)
    return FlowProgressOut(
        flow=_flow_to_out(flow),
        current_step=cur,
        total_steps=total,
        is_completed=completed,
        next_step=steps[cur] if cur < total else None,
        answers=progress.answers or {} if progress else {},
    )


# ---------------------------------------------------------------------------
# User-facing endpoints
# ---------------------------------------------------------------------------


@router.get("/flows", response_model=list[FlowOut])
async def list_flows(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """List flows the current user can see. Admins/HR see everything; regular
    users only see flows targeting their department (plus any global one)."""
    rows = (
        await db.scalars(select(OnboardingFlow).order_by(OnboardingFlow.name))
    ).all()
    if user.role in ("admin", "hr"):
        return [_flow_to_out(f) for f in rows]
    user_dept = (user.department or "").strip().lower()
    out: list[FlowOut] = []
    for f in rows:
        dept = (f.department or "").strip().lower()
        if not dept or dept == user_dept:
            out.append(_flow_to_out(f))
    return out


@router.get("/flows/me", response_model=FlowProgressOut)
async def my_flow(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Return the user's most recently touched flow + their progress in it.
    If none, auto-pick a flow matching the user's department."""
    progress = await db.scalar(
        select(UserFlowProgress)
        .where(UserFlowProgress.user_id == user.id)
        .order_by(UserFlowProgress.updated_at.desc())
    )
    flow: OnboardingFlow | None
    if progress:
        flow = await db.get(OnboardingFlow, progress.flow_id)
    else:
        flow = await _flow_for_user(db, user)
    return _progress_payload(flow, progress)


@router.post("/flows/me/start", response_model=FlowProgressOut)
async def start_flow(
    payload: StartRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    flow = await db.get(OnboardingFlow, payload.flow_id)
    if not flow:
        raise HTTPException(404, "Поток не найден")
    progress = await db.scalar(
        select(UserFlowProgress).where(
            and_(UserFlowProgress.user_id == user.id, UserFlowProgress.flow_id == flow.id)
        )
    )
    if progress is None:
        progress = UserFlowProgress(user_id=user.id, flow_id=flow.id, current_step=0, answers={})
        db.add(progress)
    else:
        # If the user explicitly starts a flow they've already finished, treat
        # it as a restart rather than a no-op.
        if progress.completed_at is not None:
            progress.current_step = 0
            progress.answers = {}
            progress.completed_at = None
    await db.commit()
    await db.refresh(progress)
    return _progress_payload(flow, progress)


@router.post("/flows/me/advance", response_model=FlowProgressOut)
async def advance_flow(
    payload: AdvanceRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    flow = await db.get(OnboardingFlow, payload.flow_id)
    if not flow:
        raise HTTPException(404, "Поток не найден")
    steps = list(flow.steps or [])
    total = len(steps)

    progress = await db.scalar(
        select(UserFlowProgress).where(
            and_(UserFlowProgress.user_id == user.id, UserFlowProgress.flow_id == flow.id)
        )
    )
    if progress is None:
        progress = UserFlowProgress(user_id=user.id, flow_id=flow.id, current_step=0, answers={})
        db.add(progress)
        await db.flush()

    if progress.current_step >= total:
        # Already done — nothing to advance to.
        return _progress_payload(flow, progress)

    # Persist the answer keyed by step.id (or by index when the step lacks an id).
    if payload.answer is not None:
        step = steps[progress.current_step] if progress.current_step < total else None
        key = (step or {}).get("id") if isinstance(step, dict) else None
        if not key:
            key = f"step_{progress.current_step}"
        answers = dict(progress.answers or {})
        answers[str(key)] = payload.answer
        progress.answers = answers

    progress.current_step = min(total, progress.current_step + 1)
    if progress.current_step >= total and progress.completed_at is None:
        progress.completed_at = datetime.utcnow()
        await log_activity(
            db,
            user_id=user.id,
            kind="flow_completed",
            title=f"Норс провёл по «{flow.name}»",
            detail=f"steps={total}",
        )

    await db.commit()
    await db.refresh(progress)
    return _progress_payload(flow, progress)


@router.post("/flows/me/reset", response_model=FlowProgressOut)
async def reset_flow(
    payload: StartRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    flow = await db.get(OnboardingFlow, payload.flow_id)
    if not flow:
        raise HTTPException(404, "Поток не найден")
    progress = await db.scalar(
        select(UserFlowProgress).where(
            and_(UserFlowProgress.user_id == user.id, UserFlowProgress.flow_id == flow.id)
        )
    )
    if progress:
        progress.current_step = 0
        progress.answers = {}
        progress.completed_at = None
        await db.commit()
        await db.refresh(progress)
    return _progress_payload(flow, progress)


# ---------------------------------------------------------------------------
# Admin CRUD
# ---------------------------------------------------------------------------


@admin_router.get("", response_model=list[FlowOut], dependencies=[Depends(require_role("admin"))])
async def admin_list_flows(db: AsyncSession = Depends(get_session)):
    rows = (
        await db.scalars(select(OnboardingFlow).order_by(OnboardingFlow.name))
    ).all()
    return [_flow_to_out(f) for f in rows]


@admin_router.post(
    "",
    response_model=FlowOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin"))],
)
async def admin_create_flow(
    payload: FlowCreateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    existing = await db.scalar(select(OnboardingFlow).where(OnboardingFlow.slug == payload.slug))
    if existing:
        raise HTTPException(409, "Поток с таким slug уже существует")
    flow = OnboardingFlow(
        slug=payload.slug,
        name=payload.name,
        description=payload.description,
        department=payload.department,
        steps=[s.model_dump() for s in payload.steps],
        created_by=user.id,
    )
    db.add(flow)
    await db.commit()
    await db.refresh(flow)
    return _flow_to_out(flow)


@admin_router.put(
    "/{flow_id}",
    response_model=FlowOut,
    dependencies=[Depends(require_role("admin"))],
)
async def admin_update_flow(
    flow_id: int,
    payload: FlowUpdateRequest,
    db: AsyncSession = Depends(get_session),
):
    flow = await db.get(OnboardingFlow, flow_id)
    if not flow:
        raise HTTPException(404, "Поток не найден")
    if payload.name is not None:
        flow.name = payload.name
    if payload.description is not None:
        flow.description = payload.description
    if payload.department is not None:
        flow.department = payload.department
    if payload.steps is not None:
        flow.steps = [s.model_dump() for s in payload.steps]
    await db.commit()
    await db.refresh(flow)
    return _flow_to_out(flow)


@admin_router.delete(
    "/{flow_id}",
    dependencies=[Depends(require_role("admin"))],
)
async def admin_delete_flow(
    flow_id: int,
    db: AsyncSession = Depends(get_session),
):
    flow = await db.get(OnboardingFlow, flow_id)
    if not flow:
        raise HTTPException(404, "Поток не найден")
    await db.delete(flow)
    await db.commit()
    return {"deleted": True}
