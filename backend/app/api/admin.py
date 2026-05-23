"""Admin-интерфейс: управление контентом и системой.

Только для роли `admin`. Позволяет:
- управлять кастомными курсами (создание/редактирование/удаление, авто-квиз)
- загружать новые документы базы знаний
- видеть общесистемную статистику
- управлять пользователями (создание, роли)
"""
import re
import secrets
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.rag import rag_index
from app.ai.vector_store import vector_store
from app.core.config import settings
from app.core.deps import current_user, require_role
from app.core.security import hash_password
from app.courses.catalog import COURSES, list_courses
from app.db.activity import log_activity
from app.db.models import (
    ActivityEvent,
    ChatMessage,
    CourseProgress,
    CustomCourse,
    KnowledgeFile,
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
    # Direction the file belongs to ("Backend", "HR", ...). "" = unclassified.
    direction: str = ""
    title: str = ""
    vector_count: int = 0
    content_type: str = ""


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


class CourseUpdateRequest(BaseModel):
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


class QuizGenerateRequest(BaseModel):
    """Source material for quiz generation. Either pass `lessons` (the lesson
    bodies the questions should be based on) or a free-form `material` blob."""

    lessons: list[CourseLessonIn] = []
    material: str = ""
    count: int = Field(default=4, ge=1, le=12)


class AdminUserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    role: Literal["user", "hr", "admin"] = "user"
    position: str = "intern"
    department: str = ""
    program: str = ""


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


@router.put("/courses/{course_id}", response_model=CustomCourseOut)
async def admin_update_course(
    course_id: int,
    payload: CourseUpdateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    course = await db.get(CustomCourse, course_id)
    if not course:
        raise HTTPException(404, "Курс не найден")

    for q in payload.quiz:
        if not any(o.correct for o in q.options):
            raise HTTPException(400, f"Вопрос «{q.id}» не содержит правильного ответа")

    course.title = payload.title
    course.subtitle = payload.subtitle
    course.description = payload.description
    course.icon = payload.icon
    course.difficulty = payload.difficulty
    course.estimated_minutes = payload.estimated_minutes
    course.target_scenario_id = payload.target_scenario_id
    course.tags = payload.tags
    course.lessons = [l.model_dump() for l in payload.lessons]
    course.quiz = [q.model_dump() for q in payload.quiz]

    await log_activity(
        db,
        user_id=user.id,
        kind="admin_course_updated",
        title=f"Курс обновлён: {course.title}",
        detail=f"slug={course.slug}",
    )
    await db.commit()
    await db.refresh(course)

    creator_name: str | None = None
    if course.created_by:
        creator = await db.get(User, course.created_by)
        creator_name = creator.full_name if creator else None

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
        created_by_name=creator_name,
        source="custom",
    )


@router.post("/courses/quiz/generate", response_model=list[CourseQuizQuestionIn])
async def admin_generate_quiz(payload: QuizGenerateRequest):
    """Generate quiz questions from lesson bodies or arbitrary material.

    Uses Claude when an API key is configured; otherwise falls back to a
    deterministic, rule-based generator that picks salient sentences from the
    source text and turns them into single-choice questions. The output is
    always a list ready to be assigned to ``CustomCourse.quiz``.
    """
    if payload.lessons:
        source = "\n\n".join(
            f"# {l.title}\n{l.body_md or l.summary}".strip()
            for l in payload.lessons
            if (l.body_md or l.summary or l.title).strip()
        )
    else:
        source = payload.material

    source = source.strip()
    if not source:
        raise HTTPException(400, "Нет исходного материала для генерации")

    questions = await _generate_quiz_questions(source, payload.count)
    if not questions:
        raise HTTPException(422, "Не удалось сгенерировать вопросы")
    return questions


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


MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB ceiling per file


async def _scan_orphans_into_db(db: AsyncSession) -> None:
    """One-time backfill: if there are files on disk that don't yet have a
    ``KnowledgeFile`` row, register them so the admin list matches reality.
    We don't index orphans into Qdrant automatically — the admin can hit
    "re-index" after assigning a direction."""
    p = settings.regulations_path
    if not p.exists():
        return
    known = {
        row.filename
        for row in (await db.scalars(select(KnowledgeFile))).all()
    }
    for f in sorted(p.iterdir()):
        if not f.is_file() or f.name.startswith("."):
            continue
        if f.name in known:
            continue
        st = f.stat()
        db.add(
            KnowledgeFile(
                filename=f.name,
                direction="",
                title=f.stem,
                size_bytes=st.st_size,
                content_type="application/octet-stream",
                vector_count=0,
            )
        )
    await db.commit()


@router.get("/regulations", response_model=list[RegulationOut])
async def admin_regulations(
    direction: str | None = None,
    db: AsyncSession = Depends(get_session),
):
    """List knowledge-base files. Optional ``direction`` query parameter
    filters to a single direction so the admin panel can scope the view."""
    await _scan_orphans_into_db(db)
    stmt = select(KnowledgeFile).order_by(KnowledgeFile.created_at.desc())
    if direction is not None and direction != "":
        stmt = stmt.where(KnowledgeFile.direction == direction)
    rows = (await db.scalars(stmt)).all()
    return [
        RegulationOut(
            filename=r.filename,
            size_bytes=r.size_bytes,
            modified_at=r.updated_at or r.created_at,
            direction=r.direction or "",
            title=r.title or r.filename,
            vector_count=r.vector_count or 0,
            content_type=r.content_type or "",
        )
        for r in rows
    ]


@router.get("/regulations/directions")
async def admin_regulation_directions(db: AsyncSession = Depends(get_session)):
    """Distinct list of directions, for the upload-form autocomplete."""
    rows = (
        await db.scalars(
            select(KnowledgeFile.direction).where(KnowledgeFile.direction != "").distinct()
        )
    ).all()
    return {"directions": sorted({(r or "").strip() for r in rows if (r or "").strip()})}


@router.post("/regulations/upload")
async def admin_upload_regulation(
    file: UploadFile = File(...),
    # Direction lives on the form so we can upload + classify in one round-trip.
    direction: str = Form(""),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    if not file.filename:
        raise HTTPException(400, "Файл не выбран")
    safe_name = re.sub(r"[^A-Za-z0-9._\-]", "_", file.filename)
    target = settings.regulations_path / safe_name
    settings.regulations_path.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл больше 25 МБ")
    target.write_bytes(content)
    direction_clean = (direction or "").strip()[:128]

    # Upsert the DB row first so we have a stable id for Qdrant payloads.
    existing = await db.scalar(
        select(KnowledgeFile).where(KnowledgeFile.filename == safe_name)
    )
    if existing is None:
        record = KnowledgeFile(
            filename=safe_name,
            direction=direction_clean,
            title=safe_name,
            size_bytes=len(content),
            content_type=file.content_type or "application/octet-stream",
            uploaded_by=user.id,
        )
        db.add(record)
        await db.flush()
    else:
        record = existing
        record.direction = direction_clean
        record.size_bytes = len(content)
        record.content_type = file.content_type or record.content_type
        record.uploaded_by = user.id
        await db.flush()

    # BM25 still indexes the on-disk markdown files (legacy compatibility, and
    # the user-facing fallback path when Qdrant isn't running).
    bm25_chunks = rag_index.load_dir(settings.regulations_path)

    # Vector indexing: only meaningful for text-based files. We don't try to
    # decode PDF/video here — those still serve as downloadable attachments
    # via the existing static mount.
    vector_count = 0
    if safe_name.lower().endswith((".md", ".markdown", ".txt")):
        try:
            text = content.decode("utf-8", errors="replace")
        except Exception:
            text = ""
        if text:
            # First lines double as a title fallback.
            first_line = next((ln for ln in text.splitlines() if ln.strip()), "")
            record.title = first_line.lstrip("# ").strip()[:200] or safe_name
            vector_count = await vector_store.index_file(
                file_id=record.id,
                filename=safe_name,
                text=text,
                direction=direction_clean,
            )
    record.vector_count = vector_count

    await log_activity(
        db,
        user_id=user.id,
        kind="admin_regulation_uploaded",
        title=f"Загружен файл: {safe_name}",
        detail=f"direction={direction_clean or '—'} · vectors={vector_count} · bm25={bm25_chunks}",
    )
    await db.commit()
    return {
        "filename": safe_name,
        "direction": direction_clean,
        "size_bytes": len(content),
        "rag_chunks": bm25_chunks,
        "vector_count": vector_count,
    }


class RegulationPatch(BaseModel):
    direction: str = ""


@router.patch("/regulations/{filename}")
async def admin_patch_regulation(
    filename: str,
    payload: RegulationPatch,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    """Re-classify a file's direction. Re-embeds the chunks so the new
    direction is reflected in Qdrant payloads (and search-time filters)."""
    safe_name = re.sub(r"[^A-Za-z0-9._\-]", "_", filename)
    record = await db.scalar(select(KnowledgeFile).where(KnowledgeFile.filename == safe_name))
    if not record:
        raise HTTPException(404, "Файл не найден")
    new_direction = (payload.direction or "").strip()[:128]
    record.direction = new_direction

    # Re-index in Qdrant so the new direction lands on existing chunks.
    if safe_name.lower().endswith((".md", ".markdown", ".txt")):
        target = settings.regulations_path / safe_name
        if target.exists():
            try:
                text = target.read_text(encoding="utf-8", errors="replace")
                record.vector_count = await vector_store.index_file(
                    file_id=record.id,
                    filename=safe_name,
                    text=text,
                    direction=new_direction,
                )
            except Exception:
                pass

    await log_activity(
        db,
        user_id=user.id,
        kind="admin_regulation_updated",
        title=f"Направление изменено: {safe_name}",
        detail=f"direction={new_direction or '—'}",
    )
    await db.commit()
    return {"filename": safe_name, "direction": new_direction, "vector_count": record.vector_count}


@router.delete("/regulations/{filename}")
async def admin_delete_regulation(
    filename: str,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_session),
):
    safe_name = re.sub(r"[^A-Za-z0-9._\-]", "_", filename)
    target = settings.regulations_path / safe_name
    record = await db.scalar(select(KnowledgeFile).where(KnowledgeFile.filename == safe_name))
    if not target.exists() and not record:
        raise HTTPException(404, "Файл не найден")
    if target.exists():
        target.unlink()
    if record:
        await vector_store.forget_file(record.id)
        await db.delete(record)
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


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def admin_create_user(
    payload: AdminUserCreateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    email = payload.email.lower().strip()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(409, "Пользователь с таким email уже существует")

    employee_id = f"ADM-{int(datetime.utcnow().timestamp())}-{secrets.token_hex(2)}"
    new_user = User(
        employee_id=employee_id,
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        position=payload.position or "intern",
        department=payload.department,
        program=payload.program,
    )
    db.add(new_user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "Пользователь с таким email уже существует")
    await log_activity(
        db,
        user_id=user.id,
        kind="admin_user_created",
        title=f"Создан пользователь: {new_user.full_name}",
        detail=f"{new_user.email} · {new_user.role}",
    )
    await db.commit()
    await db.refresh(new_user)
    return {
        "id": new_user.id,
        "employee_id": new_user.employee_id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "position": new_user.position,
        "department": new_user.department,
        "program": new_user.program,
        "created_at": new_user.created_at,
    }


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
# General-purpose uploads (lesson attachments, avatars)
# ---------------------------------------------------------------------------


class UploadOut(BaseModel):
    url: str
    filename: str
    size_bytes: int
    content_type: str


@router.post("/uploads", response_model=UploadOut)
async def admin_upload_asset(
    file: UploadFile = File(...),
    user: User = Depends(current_user),
):
    """Upload any file (video, PPTX, PDF, image…) and get back a static URL
    that can be referenced from lessons or user profiles."""
    if not file.filename:
        raise HTTPException(400, "Файл не выбран")
    safe_name = re.sub(r"[^A-Za-z0-9._\-]", "_", file.filename)
    # Bucket uploads by year/month so the directory doesn't grow into a single
    # giant folder over time.
    now = datetime.utcnow()
    subdir = settings.uploads_path / f"{now.year:04d}" / f"{now.month:02d}"
    subdir.mkdir(parents=True, exist_ok=True)
    # Avoid collisions: prefix with a short timestamp + random suffix.
    target = subdir / f"{int(now.timestamp())}-{secrets.token_hex(3)}-{safe_name}"
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл больше 25 МБ")
    target.write_bytes(content)
    rel = target.relative_to(settings.uploads_path).as_posix()
    return UploadOut(
        url=f"/static/uploads/{rel}",
        filename=safe_name,
        size_bytes=len(content),
        content_type=file.content_type or "application/octet-stream",
    )


# ---------------------------------------------------------------------------
# Admin: full user update (role + job_title + department + program + position)
# ---------------------------------------------------------------------------


class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    role: Literal["user", "hr", "admin"] | None = None
    position: str | None = None
    department: str | None = None
    program: str | None = None
    job_title: str | None = None
    avatar_url: str | None = None


@router.patch("/users/{user_id}")
async def admin_update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(404, "Пользователь не найден")
    if target.id == user.id and payload.role and payload.role != "admin":
        raise HTTPException(400, "Нельзя понизить собственную роль")

    changes: list[str] = []
    if payload.full_name is not None and payload.full_name != target.full_name:
        target.full_name = payload.full_name
        changes.append("имя")
    if payload.role is not None and payload.role != target.role:
        changes.append(f"роль: {target.role} → {payload.role}")
        target.role = payload.role
    if payload.position is not None:
        target.position = payload.position
    if payload.department is not None:
        target.department = payload.department
    if payload.program is not None:
        target.program = payload.program
    if payload.job_title is not None and payload.job_title != target.job_title:
        target.job_title = payload.job_title
        changes.append(f"должность: «{payload.job_title}»")
    if payload.avatar_url is not None:
        target.avatar_url = payload.avatar_url

    if changes:
        await log_activity(
            db,
            user_id=user.id,
            kind="admin_user_updated",
            title=f"Профиль обновлён: {target.full_name}",
            detail=", ".join(changes),
        )
    await db.commit()
    await db.refresh(target)
    return {
        "id": target.id,
        "employee_id": target.employee_id,
        "email": target.email,
        "full_name": target.full_name,
        "role": target.role,
        "position": target.position,
        "department": target.department,
        "program": target.program,
        "job_title": target.job_title,
        "avatar_url": target.avatar_url,
        "created_at": target.created_at,
    }


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


# ---------------------------------------------------------------------------
# Quiz auto-generation
# ---------------------------------------------------------------------------


def _split_sentences(text: str) -> list[str]:
    """Very small sentence splitter that copes with Cyrillic + Latin text."""
    cleaned = re.sub(r"```.*?```", " ", text, flags=re.S)
    cleaned = re.sub(r"^#+\s.*$", " ", cleaned, flags=re.M)
    cleaned = re.sub(r"[*_`>#-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    parts = re.split(r"(?<=[.!?])\s+", cleaned)
    return [p.strip() for p in parts if 30 <= len(p.strip()) <= 220]


def _rule_based_quiz(source: str, count: int) -> list[dict]:
    """Pick salient sentences and make single-choice questions out of them.

    Distractors are derived from other sentences in the source so the wrong
    answers stay topical instead of being generic noise.
    """
    sentences = _split_sentences(source)
    if not sentences:
        return []

    seen: set[str] = set()
    picks: list[str] = []
    for s in sentences:
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        picks.append(s)
        if len(picks) >= count:
            break

    if len(picks) < 2:
        return []

    quiz: list[dict] = []
    for i, sentence in enumerate(picks):
        wrong_pool = [s for s in sentences if s != sentence]
        secrets.SystemRandom().shuffle(wrong_pool)
        wrongs = wrong_pool[:2] or [
            "Это утверждение не относится к материалу урока.",
            "В уроке не описан такой подход.",
        ]
        options = [
            {"id": "a", "text": sentence, "correct": True},
            {"id": "b", "text": wrongs[0], "correct": False},
        ]
        if len(wrongs) > 1:
            options.append({"id": "c", "text": wrongs[1], "correct": False})
        # Shuffle option order so the correct answer isn't always "a".
        secrets.SystemRandom().shuffle(options)
        for j, opt in enumerate(options):
            opt["id"] = chr(ord("a") + j)
        quiz.append({
            "id": f"q{i + 1}",
            "question": "Какое из утверждений соответствует материалу урока?",
            "options": options,
            "explanation": sentence,
        })
    return quiz


def _safe_json_parse(text: str) -> list[dict] | None:
    import json
    try:
        data = json.loads(text)
    except Exception:
        # Try to extract a JSON array from a larger response.
        match = re.search(r"\[.*\]", text, flags=re.S)
        if not match:
            return None
        try:
            data = json.loads(match.group(0))
        except Exception:
            return None
    if not isinstance(data, list):
        return None
    return data


async def _generate_quiz_questions(source: str, count: int) -> list[dict]:
    """Use the configured LLM (Gemini → Anthropic). Fall back to a deterministic
    rule-based generator if no provider is available or the call fails."""
    from app.ai.llm import chat_completion  # local import to avoid cycles

    if settings.llm_provider == "mock":
        return _rule_based_quiz(source, count)

    prompt = (
        "Ты — методист корпоративного обучения. По материалу ниже сгенерируй "
        f"{count} вопросов с одним правильным ответом и двумя-тремя "
        "дистракторами. Все варианты должны быть короткими (≤ 120 символов) "
        "и грамматически согласованными. Ответ верни строго в формате JSON-массива:\n"
        '[{"id":"q1","question":"...","options":'
        '[{"id":"a","text":"...","correct":true},'
        '{"id":"b","text":"...","correct":false}],'
        '"explanation":"..."}]\n\n'
        f"Материал:\n{source[:6000]}"
    )
    try:
        text = await chat_completion(prompt, max_tokens=2048, json_mode=True)
    except Exception:
        return _rule_based_quiz(source, count)

    parsed = _safe_json_parse(text)
    if not parsed:
        return _rule_based_quiz(source, count)

    # Normalise output so it matches the CourseQuizQuestionIn schema exactly.
    questions: list[dict] = []
    for i, q in enumerate(parsed[:count]):
        if not isinstance(q, dict):
            continue
        opts = q.get("options") or []
        if not isinstance(opts, list) or not opts:
            continue
        cleaned_opts: list[dict] = []
        for j, o in enumerate(opts):
            if not isinstance(o, dict):
                continue
            cleaned_opts.append({
                "id": str(o.get("id") or chr(ord("a") + j))[:4],
                "text": str(o.get("text") or "").strip()[:240],
                "correct": bool(o.get("correct")),
            })
        if not any(o["correct"] for o in cleaned_opts) and cleaned_opts:
            cleaned_opts[0]["correct"] = True
        questions.append({
            "id": str(q.get("id") or f"q{i + 1}")[:8],
            "question": str(q.get("question") or "").strip()[:500],
            "options": cleaned_opts,
            "explanation": str(q.get("explanation") or "").strip()[:500],
        })
    questions = [q for q in questions if q["question"] and q["options"]]
    return questions or _rule_based_quiz(source, count)
