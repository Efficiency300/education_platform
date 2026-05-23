import logging
from contextlib import asynccontextmanager

from sqlalchemy import select
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import hash_password
from app.db.session import init_db, SessionLocal
from app.db.models import User
from app.ai.rag import rag_index
from app.api import (
    users,
    chat,
    simulator,
    progress,
    ispring,
    badges,
    hr_import,
    courses,
    activity,
    auth,
    hr,
    admin,
)

setup_logging()
log = logging.getLogger("app")


DEMO_ACCOUNTS = [
    {
        "employee_id": "DEMO-001",
        "email": "user@turonbank.uz",
        "password": "user12345",
        "full_name": "Алишер Стажёр",
        "role": "user",
        "position": "intern",
        "department": "Розничный блок",
        "program": "Kelajakka qadam",
    },
    {
        "employee_id": "DEMO-HR-001",
        "email": "hr@turonbank.uz",
        "password": "hr12345",
        "full_name": "Зарина HR",
        "role": "hr",
        "position": "employee",
        "department": "HR",
        "program": "Onboarding Programs",
    },
    {
        "employee_id": "DEMO-ADM-001",
        "email": "admin@turonbank.uz",
        "password": "admin12345",
        "full_name": "Бахтиёр Админ",
        "role": "admin",
        "position": "employee",
        "department": "IT",
        "program": "Platform Ops",
    },
]


async def _seed_demo_users() -> None:
    async with SessionLocal() as session:
        for acc in DEMO_ACCOUNTS:
            existing = await session.scalar(select(User).where(User.email == acc["email"]))
            if existing:
                # обновляем пароль и роль на каждый старт — удобно для демо
                existing.password_hash = hash_password(acc["password"])
                existing.role = acc["role"]
                continue
            session.add(
                User(
                    employee_id=acc["employee_id"],
                    email=acc["email"],
                    password_hash=hash_password(acc["password"]),
                    full_name=acc["full_name"],
                    role=acc["role"],
                    position=acc["position"],
                    department=acc["department"],
                    program=acc["program"],
                )
            )
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _seed_demo_users()
    loaded = rag_index.load_dir(settings.regulations_path)
    log.info(
        "startup: RAG=%s chunks · LLM=%s · iSpring=%s · demo accounts seeded",
        loaded,
        "live" if settings.anthropic_api_key else "mock",
        "live" if settings.ispring_base_url else "mock",
    )
    yield


app = FastAPI(title="AI-Mentor: Turonbank", version="0.3.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "llm_mode": "live" if settings.anthropic_api_key else "mock",
        "ispring_mode": "live" if settings.ispring_base_url else "mock",
        "rag_chunks": len(rag_index.chunks),
        "version": app.version,
    }


for router in (
    auth.router,
    users.router,
    chat.router,
    simulator.router,
    progress.router,
    ispring.router,
    badges.router,
    hr_import.router,
    courses.router,
    activity.router,
    hr.router,
    admin.router,
):
    app.include_router(router, prefix="/api")
