from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import Progress, User
from app.schemas.progress import ProgressSummary, ProgressOut
from app.simulator.scenarios import SCENARIOS

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
    total_modules = max(len(SCENARIOS), 1)
    overall = sum(r.completion_pct for r in rows) / total_modules
    total_points = sum(r.points for r in rows)

    return ProgressSummary(
        user_id=user.id,
        full_name=user.full_name,
        total_points=total_points,
        overall_completion_pct=round(overall, 1),
        modules=[ProgressOut.model_validate(r) for r in rows],
    )
