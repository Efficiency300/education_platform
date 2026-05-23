"""Лента активности пользователя.

Возвращает последние N событий — от завершения уроков и сценариев
до AI-вопросов и полученных бейджей.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import ActivityEvent, User
from app.schemas.courses import ActivityItem

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("/{user_id}", response_model=list[ActivityItem])
async def get_activity(
    user_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_session),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    rows = (
        await db.scalars(
            select(ActivityEvent)
            .where(ActivityEvent.user_id == user_id)
            .order_by(ActivityEvent.id.desc())
            .limit(limit)
        )
    ).all()
    return rows
