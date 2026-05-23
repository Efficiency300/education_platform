"""Public directions endpoint — authenticated users read the admin-managed
list of departments to populate multi-select pickers.

Direction CRUD (write side) lives in app.api.admin under /admin/directions.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.db.models import Direction, User
from app.db.session import get_session


router = APIRouter(prefix="/directions", tags=["directions"])


class DirectionOut(BaseModel):
    id: int
    name: str
    description: str


@router.get("", response_model=list[DirectionOut])
async def list_directions(
    db: AsyncSession = Depends(get_session),
    _user: User = Depends(current_user),
):
    rows = (await db.scalars(select(Direction).order_by(Direction.name))).all()
    return [
        DirectionOut(id=r.id, name=r.name, description=r.description or "") for r in rows
    ]
