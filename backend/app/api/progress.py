"""Сводный прогресс пользователя.

Аггрегирует и сценарии симулятора, и обучающие курсы.
Возвращает разбивку по типу + общий процент прохождения.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import Progress, User, CustomCourse
from app.schemas.progress import ProgressSummary, ProgressOut, ProgressBreakdown
from app.simulator.scenarios import SCENARIOS
from app.courses.catalog import COURSES

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/{user_id}", response_model=ProgressSummary)
async def get_progress(user_id: int, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    rows = (
        await db.scalars(
            select(Progress).where(Progress.user_id == user_id).order_by(Progress.module)
        )
    ).all()

    custom_total = await db.scalar(select(func.count(CustomCourse.id))) or 0
    total_courses = len(COURSES) + int(custom_total)
    total_units = max(len(SCENARIOS) + total_courses, 1)

    overall = sum(r.completion_pct for r in rows) / total_units
    total_points = sum(r.points for r in rows)

    sim_rows = [r for r in rows if r.kind == "simulator" or not r.module.startswith("course:")]
    crs_rows = [r for r in rows if r.kind == "course" or r.module.startswith("course:")]

    breakdown = ProgressBreakdown(
        simulator_done=len([r for r in sim_rows if r.completion_pct > 0]),
        simulator_total=len(SCENARIOS),
        courses_done=len([r for r in crs_rows if r.completion_pct >= 100.0]),
        courses_total=total_courses,
    )

    return ProgressSummary(
        user_id=user.id,
        full_name=user.full_name,
        total_points=total_points,
        overall_completion_pct=round(overall, 1),
        breakdown=breakdown,
        modules=[ProgressOut.model_validate(r) for r in rows],
    )
