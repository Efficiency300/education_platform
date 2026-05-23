"""Аутентификация: регистрация, логин, /me."""
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.activity import log_activity
from app.db.models import User
from app.db.session import get_session
from app.schemas.users import (
    AuthResponse,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_session)):
    email = payload.email.lower().strip()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Пользователь с таким email уже существует")

    # уникальный employee_id: timestamp + случайный суффикс на случай коллизии в одну секунду
    employee_id = f"AUTO-{int(datetime.utcnow().timestamp())}-{secrets.token_hex(2)}"
    user = User(
        employee_id=employee_id,
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role="user",  # самостоятельная регистрация — только обычный пользователь
        position=payload.position or "intern",
        department=payload.department,
        program=payload.program,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Пользователь с таким email уже существует")
    await log_activity(
        db,
        user_id=user.id,
        kind="account_created",
        title="Аккаунт создан",
        detail=f"Регистрация: {user.email}",
    )
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user_id=user.id, role=user.role)
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_session)):
    email = payload.email.lower().strip()
    user = await db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")
    token = create_access_token(user_id=user.id, role=user.role)
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(current_user)):
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Self-service profile update. Users can change their display name and
    avatar; everything role-related (role, job_title, position, department)
    stays admin-only."""
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url.strip()
    await db.commit()
    await db.refresh(user)
    return user
