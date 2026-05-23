from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import User
from app.schemas.users import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_session)):
    existing = await db.scalar(select(User).where(User.employee_id == payload.employee_id))
    if existing:
        return existing
    data = payload.model_dump()
    if not data.get("email"):
        # синтетический email — иначе уникальный индекс по пустой строке упадёт
        data["email"] = f"{payload.employee_id.lower()}@imported.turonbank.uz"
    user = User(**data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_session)):
    rows = (await db.scalars(select(User).order_by(User.id))).all()
    return rows


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user
