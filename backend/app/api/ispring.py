"""Интеграция с iSpring LMS.

В MVP — mock-режим: эндпоинт принимает результаты и возвращает
успешный отклик. Если задан ISPRING_BASE_URL — реально проксирует
через httpx.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_session
from app.db.models import User, Progress
from sqlalchemy import select

router = APIRouter(prefix="/ispring", tags=["ispring"])


class IspringSyncRequest(BaseModel):
    user_id: int


class IspringSyncResponse(BaseModel):
    mode: str
    sent: dict


@router.post("/sync", response_model=IspringSyncResponse)
async def sync_to_ispring(
    payload: IspringSyncRequest, db: AsyncSession = Depends(get_session)
):
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")

    rows = (
        await db.scalars(select(Progress).where(Progress.user_id == user.id))
    ).all()
    sent = {
        "employee_id": user.employee_id,
        "full_name": user.full_name,
        "modules": [
            {
                "module": r.module,
                "completion_pct": r.completion_pct,
                "points": r.points,
            }
            for r in rows
        ],
    }

    if not settings.ispring_base_url:
        return IspringSyncResponse(mode="mock", sent=sent)

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{settings.ispring_base_url.rstrip('/')}/api/v1/results",
            json=sent,
            headers={"Authorization": f"Bearer {settings.ispring_api_key}"},
        )
        resp.raise_for_status()
    return IspringSyncResponse(mode="live", sent=sent)
