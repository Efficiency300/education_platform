from contextlib import asynccontextmanager
from sqlalchemy import select
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db, SessionLocal
from app.db.models import User
from app.ai.rag import rag_index
from app.api import users, chat, simulator, progress, ispring


async def _seed_demo_user() -> None:
    """Создаёт демо-пользователя, чтобы фронт работал из коробки."""
    async with SessionLocal() as session:
        existing = await session.scalar(select(User).where(User.employee_id == "DEMO-001"))
        if existing:
            return
        session.add(
            User(
                employee_id="DEMO-001",
                full_name="Демо Стажёр",
                role="intern",
                department="Розничный блок",
                program="Kelajakka qadam",
            )
        )
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _seed_demo_user()
    loaded = rag_index.load_dir(settings.regulations_path)
    print(f"[startup] RAG: загружено {loaded} фрагментов из {settings.regulations_path}")
    yield


app = FastAPI(title="AI-Mentor: Turonbank", version="0.1.0", lifespan=lifespan)

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
    }


app.include_router(users.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(simulator.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(ispring.router, prefix="/api")
