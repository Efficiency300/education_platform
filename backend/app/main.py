import logging
from contextlib import asynccontextmanager

from sqlalchemy import select
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import hash_password
from app.db.session import init_db, SessionLocal
from app.db.models import OnboardingFlow, Scenario, User
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
    teams,
    flows,
    north,
)

setup_logging()
log = logging.getLogger("app")


DEMO_ACCOUNTS = [
    {
        "employee_id": "DEMO-001",
        "email": "user@kompas.uz",
        "password": "user12345",
        "full_name": "Алишер Стажёр",
        "role": "user",
        "position": "intern",
        "department": "Розничный блок",
        "program": "Kelajakka qadam",
    },
    {
        "employee_id": "DEMO-HR-001",
        "email": "hr@kompas.uz",
        "password": "hr12345",
        "full_name": "Зарина HR",
        "role": "hr",
        "position": "employee",
        "department": "HR",
        "program": "Onboarding Programs",
    },
    {
        "employee_id": "DEMO-ADM-001",
        "email": "admin@kompas.uz",
        "password": "admin12345",
        "full_name": "Бахтиёр Админ",
        "role": "admin",
        "position": "employee",
        "department": "IT",
        "program": "Platform Ops",
    },
]


async def _seed_demo_users() -> None:
    """Upsert the three demo accounts on every startup.

    Look up by ``employee_id`` (the stable PK-ish identifier) so renaming the
    seed email — as we did when removing the turonbank.uz placeholder — moves
    the existing row to the new email instead of trying to insert a duplicate
    employee_id, which would fail the UNIQUE constraint.
    """
    async with SessionLocal() as session:
        for acc in DEMO_ACCOUNTS:
            existing = await session.scalar(
                select(User).where(User.employee_id == acc["employee_id"])
            )
            if existing is None:
                # Fall back to email lookup in case an old install only had
                # the email-based row (without the employee_id we seed here).
                existing = await session.scalar(select(User).where(User.email == acc["email"]))

            if existing is not None:
                existing.email = acc["email"]
                existing.password_hash = hash_password(acc["password"])
                existing.role = acc["role"]
                existing.position = acc["position"]
                existing.department = acc["department"]
                existing.program = acc["program"]
                # Don't overwrite full_name — admins may have renamed the demo
                # user via the UI, and we shouldn't fight that.
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


DEFAULT_NORS_FLOW = {
    "slug": "nors-welcome",
    "name": "Знакомство с Норсом",
    "description": "Базовый онбординг-сценарий, который ведёт новых сотрудников по платформе.",
    "department": "",
    "steps": [
        {
            "id": "hi",
            "kind": "narrative",
            "text": (
                "Привет! Я Норс — твой проводник по платформе. Я провожу тебя "
                "по первым шагам, подскажу куда смотреть и иногда буду "
                "задавать вопросы, чтобы убедиться, что мы на одной волне."
            ),
        },
        {
            "id": "where_to_learn",
            "kind": "question",
            "text": "Как думаешь, где у нас живут учебные курсы?",
            "options": [
                {"id": "a", "label": "В разделе «Курсы»"},
                {"id": "b", "label": "В разделе «Команды»"},
                {"id": "c", "label": "В разделе «Файлы»"},
            ],
            "correct_option_id": "a",
            "hint": "Меню слева — в нём всегда виден активный раздел.",
        },
        {
            "id": "knowledge_base",
            "kind": "narrative",
            "text": (
                "Отлично. Помимо курсов есть «Файлы» — там лежит вся "
                "база знаний: видео, презентации и текстовые регламенты. "
                "Я и AI-ассистент используем их, чтобы отвечать на вопросы."
            ),
        },
        {
            "id": "teams_intro",
            "kind": "narrative",
            "text": (
                "Если возник рабочий вопрос — заходи в «Команды». Это "
                "групповой чат, где старшие коллеги отвечают на вопросы. "
                "Ответы, отмеченные как канонические, попадают в базу знаний "
                "и я начинаю на них ссылаться."
            ),
        },
        {
            "id": "ai_chat",
            "kind": "narrative",
            "text": (
                "Любой вопрос по регламентам — спрашивай меня в обычной "
                "вкладке AI-ассистента. Я отвечаю на основе базы знаний "
                "и всегда показываю источники."
            ),
        },
        {
            "id": "ready_for_course",
            "kind": "question",
            "text": "Готов открыть свой первый курс?",
            "options": [
                {"id": "y", "label": "Да, поехали"},
                {"id": "n", "label": "Пока нет"},
            ],
            "correct_option_id": "y",
        },
        {
            "id": "finish",
            "kind": "narrative",
            "text": (
                "Отлично, я рядом. Если потеряешься — нажми мой значок в "
                "AI-ассистенте, и я продолжу с того места, где мы "
                "остановились."
            ),
        },
    ],
}


DEFAULT_NORTH_SCENARIO = {
    "scenario_uid": "north-general-welcome",
    "name": "Welcome from North",
    "department": "",
    "status": "published",
    "steps": [
        {
            "id": "hi",
            "order": 0,
            "north_message": (
                "Hey {name}! I'm North 🧭 — I'll be your guide here. "
                "I'll walk you through the basics, ask a few quick questions "
                "along the way, and point you to the right place when you "
                "need to go deeper."
            ),
            "input_type": "none",
            "choices": [],
            "correct_answer": None,
            "north_state": "hyped",
            "on_complete_state": "celebrating",
            "content_ref": None,
        },
        {
            "id": "where_courses",
            "order": 1,
            "north_message": "Quick check — where do our learning modules live?",
            "input_type": "choice",
            "choices": ["In Courses", "In Teams", "In Files"],
            "correct_answer": "in courses",
            "north_state": "waiting",
            "on_complete_state": "celebrating",
            "content_ref": None,
        },
        {
            "id": "kb_intro",
            "order": 2,
            "north_message": (
                "Nice — that's the main learning surface. Alongside that, "
                "we keep all reference material (videos, slides, regulations) "
                "in the Files section. The AI assistant searches those for you."
            ),
            "input_type": "none",
            "choices": [],
            "correct_answer": None,
            "north_state": "thinking",
            "on_complete_state": "celebrating",
            "content_ref": None,
        },
        {
            "id": "teams_intro",
            "order": 3,
            "north_message": (
                "If you get stuck on something practical, head to Teams — "
                "that's where seniors share tips. Once an answer is marked "
                "as canonical, it lands in the knowledge base and I'll start "
                "referencing it in the AI chat."
            ),
            "input_type": "none",
            "choices": [],
            "correct_answer": None,
            "north_state": "listening",
            "on_complete_state": "celebrating",
            "content_ref": None,
        },
        {
            "id": "ready",
            "order": 4,
            "north_message": "Ready to crack open your first course?",
            "input_type": "choice",
            "choices": ["Yes — let's go", "Not yet"],
            "correct_answer": None,
            "north_state": "waiting",
            "on_complete_state": "celebrating",
            "content_ref": None,
        },
        {
            "id": "wrap",
            "order": 5,
            "north_message": (
                "Awesome — I'm right here whenever you need me. Open my panel "
                "from the dashboard and we'll pick up where we left off."
            ),
            "input_type": "none",
            "choices": [],
            "correct_answer": None,
            "north_state": "celebrating",
            "on_complete_state": "celebrating",
            "content_ref": None,
        },
    ],
}


async def _seed_default_scenario() -> None:
    """Insert the default North scenario once. Admins can edit / unpublish
    it later without it being overwritten."""
    async with SessionLocal() as session:
        existing = await session.scalar(select(Scenario.id))
        if existing is not None:
            return
        session.add(
            Scenario(
                scenario_uid=DEFAULT_NORTH_SCENARIO["scenario_uid"],
                name=DEFAULT_NORTH_SCENARIO["name"],
                department=DEFAULT_NORTH_SCENARIO["department"],
                status=DEFAULT_NORTH_SCENARIO["status"],
                steps=DEFAULT_NORTH_SCENARIO["steps"],
            )
        )
        await session.commit()


async def _seed_default_flow() -> None:
    """Insert the default Норс flow on first boot.

    Skips silently if any flow already exists, so admins can replace it with
    their own without it being overwritten on every restart.
    """
    async with SessionLocal() as session:
        any_flow = await session.scalar(select(OnboardingFlow.id))
        if any_flow is not None:
            return
        session.add(
            OnboardingFlow(
                slug=DEFAULT_NORS_FLOW["slug"],
                name=DEFAULT_NORS_FLOW["name"],
                description=DEFAULT_NORS_FLOW["description"],
                department=DEFAULT_NORS_FLOW["department"],
                steps=DEFAULT_NORS_FLOW["steps"],
            )
        )
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _seed_demo_users()
    await _seed_default_flow()
    await _seed_default_scenario()
    # Make sure the uploads directory exists so the StaticFiles mount works
    # even on a brand-new checkout.
    settings.uploads_path.mkdir(parents=True, exist_ok=True)
    loaded = rag_index.load_dir(settings.regulations_path)
    log.info(
        "startup: RAG=%s chunks · LLM=%s · iSpring=%s · demo accounts seeded",
        loaded,
        settings.llm_provider,
        "live" if settings.ispring_base_url else "mock",
    )
    yield


app = FastAPI(title="KOMPAS", version="0.3.0", lifespan=lifespan)

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
        "llm_mode": "live" if settings.llm_provider != "mock" else "mock",
        "llm_provider": settings.llm_provider,
        "ispring_mode": "live" if settings.ispring_base_url else "mock",
        "rag_chunks": len(rag_index.chunks),
        "version": app.version,
    }


# Serve user-uploaded lesson attachments and avatars. Static files only — the
# write side is gated behind admin/user endpoints elsewhere.
settings.uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=settings.uploads_path), name="uploads")


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
    teams.router,
    flows.router,
    flows.admin_router,
    north.router,
    north.admin_router,
):
    app.include_router(router, prefix="/api")
