"""REST API курсов.

Курс = последовательность markdown-уроков + финальный квиз.
По завершении квиза (≥ pass_threshold) курс считается пройденным,
начисляется XP и пишется запись в Progress (kind='course').
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select as sa_select

from app.db.session import get_session
from app.db.models import (
    User,
    Progress,
    CourseProgress,
    LessonProgress,
    CustomCourse,
)
from app.db.activity import log_activity
from app.courses.catalog import (
    list_courses as list_builtin_courses,
    get_course as get_builtin_course,
    get_lesson,
    course_xp_reward,
)
from app.courses.translations import localize_course_dict, localize_course_summary
from app.schemas.courses import (
    CourseSummary,
    CourseDetail,
    LessonOut,
    QuizQuestion,
    QuizOption,
    LessonCompleteRequest,
    LessonCompleteResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuizQuestionResult,
)


def _custom_to_dict(c: CustomCourse) -> dict:
    return {
        "slug": c.slug,
        "title": c.title,
        "subtitle": c.subtitle or "",
        "description": c.description or "",
        "icon": c.icon or "book",
        "difficulty": c.difficulty or "easy",
        "estimated_minutes": c.estimated_minutes or 10,
        "target_scenario_id": c.target_scenario_id or "",
        "tags": list(c.tags or []),
        "directions": list(c.directions or []),
        "prerequisite_slug": c.prerequisite_slug or "",
        "order_index": c.order_index or 0,
        "lessons": list(c.lessons or []),
        "quiz": list(c.quiz or []),
    }


async def list_courses(db: AsyncSession) -> list[dict]:
    out = list_builtin_courses()
    # Backfill the new fields on built-in courses so downstream code can treat
    # them uniformly.
    for c in out:
        c.setdefault("directions", [])
        c.setdefault("prerequisite_slug", "")
        c.setdefault("order_index", 0)
    rows = (await db.scalars(sa_select(CustomCourse))).all()
    for r in rows:
        d = _custom_to_dict(r)
        out.append(
            {
                "slug": d["slug"],
                "title": d["title"],
                "subtitle": d["subtitle"],
                "description": d["description"],
                "icon": d["icon"],
                "difficulty": d["difficulty"],
                "estimated_minutes": d["estimated_minutes"],
                "target_scenario_id": d["target_scenario_id"],
                "tags": d["tags"],
                "directions": d["directions"],
                "prerequisite_slug": d["prerequisite_slug"],
                "order_index": d["order_index"],
                "lessons_count": len(d["lessons"]),
                "quiz_count": len(d["quiz"]),
            }
        )
    # Order by order_index then alphabetical so admin-defined ordering wins.
    out.sort(key=lambda c: (c.get("order_index", 0), c.get("title", "")))
    return out


async def get_course(db: AsyncSession, slug: str) -> dict | None:
    built = get_builtin_course(slug)
    if built:
        return built
    row = await db.scalar(sa_select(CustomCourse).where(CustomCourse.slug == slug))
    if not row:
        return None
    return _custom_to_dict(row)


router = APIRouter(prefix="/courses", tags=["courses"])

PASS_THRESHOLD_PCT = 70.0
LESSON_POINTS = 10


def _user_directions(user: User | None) -> set[str]:
    """Collect every direction the user counts as a member of."""
    if not user:
        return set()
    out: set[str] = set()
    for d in user.directions or []:
        if isinstance(d, str) and d.strip():
            out.add(d.strip().lower())
    if user.department:
        out.add(user.department.strip().lower())
    return out


def _course_visible_to(course: dict, user_dirs: set[str]) -> bool:
    """A course with no directions is visible to all; otherwise must overlap."""
    course_dirs = {(d or "").strip().lower() for d in (course.get("directions") or []) if d}
    if not course_dirs:
        return True
    return bool(course_dirs & user_dirs) if user_dirs else False


@router.get("", response_model=list[CourseSummary])
async def courses_index(
    user_id: int | None = None,
    lang: str | None = None,
    db: AsyncSession = Depends(get_session),
):
    items = await list_courses(db)
    items = [localize_course_summary(c, lang or "ru") for c in items]
    if not user_id:
        return [CourseSummary(**c) for c in items]

    user = await db.get(User, user_id)
    user_dirs = _user_directions(user)
    is_employee = (user.role == "user") if user else True
    # Department-split: only enforce the filter for regular users; HR/admin see
    # everything for review.
    if is_employee:
        items = [c for c in items if _course_visible_to(c, user_dirs)]

    course_rows = (
        await db.scalars(select(CourseProgress).where(CourseProgress.user_id == user_id))
    ).all()
    by_slug = {c.course_slug: c for c in course_rows}

    lesson_rows = (
        await db.scalars(select(LessonProgress).where(LessonProgress.user_id == user_id))
    ).all()
    lesson_count_by_course: dict[str, int] = {}
    for lp in lesson_rows:
        lesson_count_by_course[lp.course_slug] = (
            lesson_count_by_course.get(lp.course_slug, 0) + 1
        )

    out: list[CourseSummary] = []
    for c in items:
        cp = by_slug.get(c["slug"])
        prereq = (c.get("prerequisite_slug") or "").strip()
        # Locked when the explicit prereq isn't completed yet. Admin/HR are
        # never blocked.
        locked = False
        if is_employee and prereq:
            pcp = by_slug.get(prereq)
            locked = not (pcp and pcp.completed_at)
        out.append(
            CourseSummary(
                **c,
                lessons_completed=lesson_count_by_course.get(c["slug"], 0),
                completed=bool(cp and cp.completed_at),
                quiz_score=cp.quiz_score if cp else 0,
                quiz_max=cp.quiz_max if cp else 0,
                locked=locked,
            )
        )
    return out


@router.get("/{course_slug}", response_model=CourseDetail)
async def course_detail(
    course_slug: str,
    user_id: int | None = None,
    lang: str | None = None,
    db: AsyncSession = Depends(get_session),
):
    course = await get_course(db, course_slug)
    if not course:
        raise HTTPException(404, "Course not found")
    course = localize_course_dict(course, lang or "ru")

    completed_lesson_slugs: set[str] = set()
    cp: CourseProgress | None = None
    if user_id:
        lesson_rows = (
            await db.scalars(
                select(LessonProgress).where(
                    LessonProgress.user_id == user_id,
                    LessonProgress.course_slug == course_slug,
                )
            )
        ).all()
        completed_lesson_slugs = {lp.lesson_slug for lp in lesson_rows}
        cp = await db.scalar(
            select(CourseProgress).where(
                CourseProgress.user_id == user_id,
                CourseProgress.course_slug == course_slug,
            )
        )

    return CourseDetail(
        slug=course["slug"],
        title=course["title"],
        subtitle=course["subtitle"],
        description=course["description"],
        icon=course["icon"],
        difficulty=course["difficulty"],
        estimated_minutes=course["estimated_minutes"],
        target_scenario_id=course["target_scenario_id"],
        tags=course["tags"],
        lessons=[
            LessonOut(
                slug=l["slug"],
                title=l["title"],
                summary=l["summary"],
                duration_min=l["duration_min"],
                body_md=l["body_md"],
                completed=l["slug"] in completed_lesson_slugs,
            )
            for l in course["lessons"]
        ],
        quiz=[
            QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=[QuizOption(id=o["id"], text=o["text"]) for o in q["options"]],
            )
            for q in course["quiz"]
        ],
        completed=bool(cp and cp.completed_at),
        quiz_score=cp.quiz_score if cp else 0,
        quiz_max=cp.quiz_max if cp else 0,
        quiz_attempts=cp.quiz_attempts if cp else 0,
    )


@router.post("/lessons/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
    payload: LessonCompleteRequest, db: AsyncSession = Depends(get_session)
):
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")
    course = await get_course(db, payload.course_slug)
    if not course:
        raise HTTPException(404, "Course not found")
    lesson = get_lesson(course, payload.lesson_slug)
    if not lesson:
        raise HTTPException(404, "Lesson not found")

    await _ensure_course_progress(db, payload.user_id, payload.course_slug, course_title=course["title"], subtitle=course.get("subtitle", ""))

    existing = await db.scalar(
        select(LessonProgress).where(
            LessonProgress.user_id == payload.user_id,
            LessonProgress.course_slug == payload.course_slug,
            LessonProgress.lesson_slug == payload.lesson_slug,
        )
    )
    points_awarded = 0
    if not existing:
        db.add(
            LessonProgress(
                user_id=payload.user_id,
                course_slug=payload.course_slug,
                lesson_slug=payload.lesson_slug,
            )
        )
        points_awarded = LESSON_POINTS
        await log_activity(
            db,
            user_id=payload.user_id,
            kind="lesson_completed",
            title=f"Урок пройден: {lesson['title']}",
            detail=course["title"],
            points=points_awarded,
            payload={"course_slug": payload.course_slug, "lesson_slug": payload.lesson_slug},
        )

    done_rows = (
        await db.scalars(
            select(LessonProgress).where(
                LessonProgress.user_id == payload.user_id,
                LessonProgress.course_slug == payload.course_slug,
            )
        )
    ).all()
    done_count = len(done_rows)
    total = len(course["lessons"])

    pct = (done_count / total) * 80.0  # уроки = 80% курса, квиз = 20%
    await _upsert_progress(
        db,
        user_id=payload.user_id,
        module=f"course:{payload.course_slug}",
        kind="course",
        completion_pct=pct,
        points_total=done_count * LESSON_POINTS,
    )

    await db.commit()

    return LessonCompleteResponse(
        course_slug=payload.course_slug,
        lesson_slug=payload.lesson_slug,
        completed_count=done_count,
        total_count=total,
        points_awarded=points_awarded,
    )


@router.post("/quiz/submit", response_model=QuizSubmitResponse)
async def submit_quiz(
    payload: QuizSubmitRequest, db: AsyncSession = Depends(get_session)
):
    user = await db.get(User, payload.user_id)
    if not user:
        raise HTTPException(404, "User not found")
    course = await get_course(db, payload.course_slug)
    if not course:
        raise HTTPException(404, "Course not found")

    cp = await _ensure_course_progress(db, payload.user_id, payload.course_slug, course_title=course["title"], subtitle=course.get("subtitle", ""))
    cp.quiz_attempts = (cp.quiz_attempts or 0) + 1

    results: list[QuizQuestionResult] = []
    score = 0
    for q in course["quiz"]:
        correct_option = next((o for o in q["options"] if o["correct"]), None)
        chosen = payload.answers.get(q["id"])
        is_correct = bool(correct_option and chosen == correct_option["id"])
        if is_correct:
            score += 1
        results.append(
            QuizQuestionResult(
                question_id=q["id"],
                correct=is_correct,
                expected_option_id=correct_option["id"] if correct_option else None,
                explanation=q.get("explanation", ""),
            )
        )
    max_score = len(course["quiz"])
    pct = (score / max_score * 100.0) if max_score else 0.0
    passed = pct >= PASS_THRESHOLD_PCT
    cp.quiz_score = max(cp.quiz_score or 0, score)
    cp.quiz_max = max_score

    points_awarded = 0
    course_completed_now = False
    if passed and not cp.completed_at:
        cp.completed_at = datetime.utcnow()
        course_completed_now = True
        points_awarded = course_xp_reward(course)
        await log_activity(
            db,
            user_id=payload.user_id,
            kind="course_completed",
            title=f"Курс пройден: {course['title']}",
            detail=f"Квиз: {score}/{max_score}",
            points=points_awarded,
            payload={"course_slug": payload.course_slug},
        )
    elif passed:
        await log_activity(
            db,
            user_id=payload.user_id,
            kind="quiz_passed",
            title=f"Квиз пересдан: {course['title']}",
            detail=f"{score}/{max_score}",
            points=0,
        )
    else:
        await log_activity(
            db,
            user_id=payload.user_id,
            kind="quiz_failed",
            title=f"Квиз: {score}/{max_score} — нужен повтор",
            detail=course["title"],
            points=0,
        )

    # фиксация в общий Progress
    done_rows = (
        await db.scalars(
            select(LessonProgress).where(
                LessonProgress.user_id == payload.user_id,
                LessonProgress.course_slug == payload.course_slug,
            )
        )
    ).all()
    lessons_pct = (len(done_rows) / max(len(course["lessons"]), 1)) * 80.0
    quiz_pct = (pct / 100.0) * 20.0
    total_pct = min(100.0, lessons_pct + quiz_pct)
    await _upsert_progress(
        db,
        user_id=payload.user_id,
        module=f"course:{payload.course_slug}",
        kind="course",
        completion_pct=total_pct,
        points_total=len(done_rows) * LESSON_POINTS + (points_awarded if course_completed_now else 0),
    )

    await db.commit()

    return QuizSubmitResponse(
        course_slug=payload.course_slug,
        score=score,
        max_score=max_score,
        passed=passed,
        course_completed=course_completed_now,
        points_awarded=points_awarded,
        next_scenario_id=course["target_scenario_id"],
        results=results,
    )


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


async def _ensure_course_progress(
    db: AsyncSession,
    user_id: int,
    course_slug: str,
    *,
    course_title: str = "",
    subtitle: str = "",
) -> CourseProgress:
    cp = await db.scalar(
        select(CourseProgress).where(
            CourseProgress.user_id == user_id,
            CourseProgress.course_slug == course_slug,
        )
    )
    if cp:
        return cp
    cp = CourseProgress(user_id=user_id, course_slug=course_slug)
    db.add(cp)
    await db.flush()
    await log_activity(
        db,
        user_id=user_id,
        kind="course_started",
        title=f"Начат курс: {course_title}" if course_title else "Курс начат",
        detail=subtitle,
        payload={"course_slug": course_slug},
    )
    return cp


async def _upsert_progress(
    db: AsyncSession,
    *,
    user_id: int,
    module: str,
    kind: str,
    completion_pct: float,
    points_total: int,
) -> None:
    row = await db.scalar(
        select(Progress).where(Progress.user_id == user_id, Progress.module == module)
    )
    if row:
        row.completion_pct = max(row.completion_pct, completion_pct)
        row.points = max(row.points, points_total)
        row.kind = kind
    else:
        db.add(
            Progress(
                user_id=user_id,
                module=module,
                kind=kind,
                completion_pct=completion_pct,
                points=points_total,
            )
        )


