"""Хелперы для журнала активности пользователя.

Журнал — единый источник правды для лент Dashboard / Progress.
Любое значимое действие (урок, квиз, симулятор, чат) логируется сюда,
а лента строится одним запросом.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ActivityEvent


async def log_activity(
    db: AsyncSession,
    *,
    user_id: int,
    kind: str,
    title: str,
    detail: str = "",
    points: int = 0,
    payload: dict | None = None,
) -> ActivityEvent:
    """Запись события в журнал. Коммит — ответственность вызывающего."""
    event = ActivityEvent(
        user_id=user_id,
        kind=kind,
        title=title,
        detail=detail,
        points=points,
        payload=payload,
    )
    db.add(event)
    return event
