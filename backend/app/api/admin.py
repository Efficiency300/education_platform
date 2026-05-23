"""Admin-интерфейс: управление контентом и системой.

Только для роли `admin`. Позволяет:
- управлять кастомными курсами (создание/удаление)
- загружать новые регламенты (md)
- видеть общесистемную статистику
- управлять пользователями (роли)
"""
import re
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag import rag_index
from app.core.config import settings
from app.core.deps import current_user, require_role
from app.courses.catalog import COURSES, list_courses
from app.db.activity import log_activity
from app.db.models import (
    ActivityEvent,
    ChatMessage,
    CourseProgress,
    CustomCourse,
    LessonProgress,
    Progress,
    SimulatorSession,
    User,
)
from app.db.session import get_session

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role("admin"))],
)


# ---------------------------------------------------------------------------
# schemas
# ---------------------------------------------------------------------------


class CourseLessonIn(BaseModel):
    slug: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=1, max_length=255)
    summary: str = ""
    duration_min: int = 5
    body_md: str = ""


class CourseQuizOptionIn(BaseModel):
    id: str = Field(min_length=1, max_length=8)
    text: str
    correct: bool = False


class CourseQuizQuestionIn(BaseModel):
    id: str = Field(min_length=1, max_length=8)
    question: str
    options: list[CourseQuizOptionIn]
    explanation: str = ""


class CourseCreateRequest(BaseModel):
    slug: str = Field(min_length=2, max_length=64, pattern=r"^[a-z0-9_\-]+$")
    title: str
    subtitle: str = ""
    description: str = ""
    icon: str = "book"
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    estimated_minutes: int = 15
    target_scenario_id: str = ""
    tags: list[str] = []
    lessons: list[CourseLessonIn]
    quiz: list[CourseQuizQuestionIn]


class CustomCourseOut(BaseModel):
    id: int
    slug: str
    title: str
    subtitle: str
    description: str
    icon: str
    difficulty: str
    estimated_minutes: int
    target_scenario_id: str
    tags: list[str]
    lessons_count: int
    quiz_count: int
    created_at: datetime
    created_by_name: str | None = None
    source: str = "custom"


class RegulationOut(BaseModel):
    filename: str
    size_bytes: int
    modified_at: datetime


class SystemStats(BaseModel):
    users_total: int
    users_by_role: dict[str, int]
    courses_built_in: int
    courses_custom: int
    regulations_count: int
    rag_chunks: int
    chat_messages_total: int
    activity_events_total: int
    completed_courses_total: int
    completed_scenarios_total: int
    llm_mode: str
    ispring_mode: str


class UserRoleUpdate(BaseModel):
    role: Literal["user", "hr", "admin"]


# ---------------------------------------------------------------------------
# Courses CRUD
# ---------------------------------------------------------------------------


@router.get("/courses", response_model=list[CustomCourseOut])
async def admin_courses(db: AsyncSession = Depends(get_session)):
    """Все курсы — встроенные + пользовательские."""
    out: list[CustomCourseOut] = []
    for c in list_courses():
        out.append(
            CustomCourseOut(
                id=-1,
                slug=c["slug"],
                title=c["title"],
                subtitle=c["subtitle"],
                description=c["description"],
                icon=c["icon"],
                difficulty=c["difficulty"],
                estimated_minutes=c["estimated_minutes"],
                target_scenario_id=c["target_scenario_id"],
                tags=c["tags"],
                lessons_count=c["lessons_count"],
                quiz_count=c["quiz_count"],
                created_at=datetime.utcnow(),
                created_by_name="system",
                source="built_in",
            )
        )

    rows = (
        await db.scalars(select(CustomCourse).order_by(CustomCourse.created_at.desc()))
    ).all()
    creator_ids = {r.created_by for r in rows if r.created_by}
    creators: dict[int, str] = {}
    if creator_ids:
        users = (
            await db.scalars(select(User).where(User.id.in_(creator_ids)))
        ).all()
        creators = {u.id: u.full_name for u in users}
    for r in rows:
        out.append(
            CustomCourseOut(
                id=r.id,
                slug=r.slug,
                title=r.title,
                subtitle=r.subtitle or "",
                description=r.description or "",
                icon=r.icon or "book",
                difficulty=r.difficulty or "easy",
                estimated_minutes=r.estimated_minutes,
                target_scenario_id=r.target_scenario_id or "",
                tags=r.tags or [],
                lessons_count=len(r.lessons or []),
                quiz_count=len(r.quiz or []),
                created_at=r.created_at,
                created_by_name=creators.get(r.created_by or 0),
                source="custom",
            )
        )
    return out


@router.post("/courses", response_model=CustomCourseOut, status_code=status.HTTP_201_CREATED)
async def admin_create_course(
    payload: CourseCreateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    # запретить пересечение со встроенными slug
    if payload.slug in COURSES:
        raise HTTPException(409, "Slug конфликтует со встроенным курсом")
    existing = await db.scalar(select(CustomCourse).where(CustomCourse.slug == payload.slug))
    if existing:
        raise HTTPException(409, "Курс с таким slug уже существует")

    # валидация квиза: в каждом вопросе хотя бы один correct
    for q in payload.quiz:
        if not any(o.correct for o in q.options):
            raise HTTPException(400, f"Вопрос «{q.id}» не содержит правильного ответа")

    course = CustomCourse(
        slug=payload.slug,
        title=payload.title,
        subtitle=payload.subtitle,
        description=payload.description,
        icon=payload.icon,
        difficulty=payload.difficulty,
        estimated_minutes=payload.estimated_minutes,
        target_scenario_id=payload.target_scenario_id,
        tags=payload.tags,
        lessons=[l.model_dump() for l in payload.lessons],
        quiz=[q.model_dump() for q in payload.quiz],
        created_by=user.id,
    )
    db.add(course)
    await log_activity(
        db,
        user_id=user.id,
        kind="admin_course_created",
        title=f"Создан курс: {payload.title}",
        detail=f"slug={payload.slug}",
    )
    await db.commit()
    await db.refresh(course)

    return CustomCourseOut(
        id=course.id,
        slug=course.slug,
        title=course.title,
        subtitle=course.subtitle or "",
        description=course.description or "",
        icon=course.icon,
        difficulty=course.difficulty,
        estimated_minutes=course.estimated_minutes,
        target_scenario_id=course.target_scenario_id or "",
        tags=course.tags or [],
        lessons_count=len(course.lessons or []),
        quiz_count=len(course.quiz or []),
        created_at=course.created_at,
        created_by_name=user.full_name,
        source="custom",
    )


@router.delete("/courses/{course_id}")
async def admin_delete_course(
    course_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    course = await db.get(CustomCourse, course_id)
    if not course:
        raise HTTPException(404, "Курс не найден")
    slug = course.slug
    title = course.title
    await db.delete(course)
    await log_activity(
        db, user_id=user.id, kind="admin_course_deleted",
        title=f"Удалён курс: {title}", detail=f"slug={slug}",
    )
    await db.commit()
    return {"deleted": True, "slug": slug}


# ---------------------------------------------------------------------------
# Regulations
# ---------------------------------------------------------------------------


@router.get("/regulations", response_model=list[RegulationOut])
async def admin_regulations():
    p = settings.regulations_path
    if not p.exists():
        return []
    out = []
    for f in sorted(p.glob("*.md")):
        st = f.stat()
        out.append(
            RegulationOut(
                filename=f.name,
                size_bytes=st.st_size,
                modified_at=datetime.fromtimestamp(st.st_mtime),
            )
        )
    return out


@router.post("/regulations/upload")
async def admin_upload_regulation(
    file: UploadFile = File(...),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    if not file.filename or not file.filename.lower().endswith(".md"):
        raise HTTPException(400, "Только .md файлы")
    safe_name = re.sub(r"[^A-Za-z0-9._\-]", "_", file.filename)
    target = settings.regulations_path / safe_name
    settings.regulations_path.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    if len(content) > 1_000_000:
        raise HTTPException(413, "Файл больше 1 МБ")
    target.write_bytes(content)

    # переиндексируем RAG
    loaded = rag_index.load_dir(settings.regulations_path)

    await log_activity(
        db,
        user_id=user.id,
        kind="admin_regulation_uploaded",
        title=f"Загружен регламент: {safe_name}",
        detail=f"chunks теперь: {loaded}",
    )
    await db.commit()
    return {"filename": safe_name, "size_bytes": len(content), "rag_chunks": loaded}


@router.delete("/regulations/{filename}")
async def admin_delete_regulation(
    filename: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    safe_name = re.sub(r"[^A-Za-z0-9._\-]", "_", filename)
    target = settings.regulations_path / safe_name
    if not target.exists() or not target.is_file():
        raise HTTPException(404, "Файл не найден")
    target.unlink()
    loaded = rag_index.load_dir(settings.regulations_path)
    await log_activity(
        db,
        user_id=user.id,
        kind="admin_regulation_deleted",
        title=f"Удалён регламент: {safe_name}",
        detail=f"chunks теперь: {loaded}",
    )
    await db.commit()
    return {"deleted": True, "rag_chunks": loaded}


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


@router.get("/users")
async def admin_list_users(db: AsyncSession = Depends(get_session)):
    rows = (await db.scalars(select(User).order_by(User.role, User.full_name))).all()
    return [
        {
            "id": u.id,
            "employee_id": u.employee_id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "position": u.position,
            "department": u.department,
            "program": u.program,
            "created_at": u.created_at,
        }
        for u in rows
    ]


@router.patch("/users/{user_id}/role")
async def admin_update_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(404, "User not found")
    if target.id == user.id and payload.role != "admin":
        raise HTTPException(400, "Нельзя понизить собственную роль")
    old = target.role
    target.role = payload.role
    await log_activity(
        db,
        user_id=user.id,
        kind="admin_role_changed",
        title=f"Роль изменена: {target.full_name}",
        detail=f"{old} → {payload.role}",
    )
    await db.commit()
    return {"id": target.id, "role": target.role}


# ---------------------------------------------------------------------------
# System stats
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=SystemStats)
async def admin_stats(db: AsyncSession = Depends(get_session)):
    users = (await db.scalars(select(User))).all()
    by_role: dict[str, int] = {}
    for u in users:
        by_role[u.role] = by_role.get(u.role, 0) + 1

    custom_courses = await db.scalar(select(func.count(CustomCourse.id))) or 0
    chat_total = await db.scalar(select(func.count(ChatMessage.id))) or 0
    activity_total = await db.scalar(select(func.count(ActivityEvent.id))) or 0
    completed_courses = (
        await db.scalar(
            select(func.count(CourseProgress.id)).where(
                CourseProgress.completed_at.is_not(None)
            )
        )
    ) or 0
    completed_scenarios = (
        await db.scalar(
            select(func.count(SimulatorSession.id)).where(
                SimulatorSession.finished.is_(True)
            )
        )
    ) or 0

    reg_count = 0
    if settings.regulations_path.exists():
        reg_count = sum(1 for _ in settings.regulations_path.glob("*.md"))

    return SystemStats(
        users_total=len(users),
        users_by_role=by_role,
        courses_built_in=len(COURSES),
        courses_custom=int(custom_courses),
        regulations_count=reg_count,
        rag_chunks=len(rag_index.chunks),
        chat_messages_total=int(chat_total),
        activity_events_total=int(activity_total),
        completed_courses_total=int(completed_courses),
        completed_scenarios_total=int(completed_scenarios),
        llm_mode="live" if settings.anthropic_api_key else "mock",
        ispring_mode="live" if settings.ispring_base_url else "mock",
    )
