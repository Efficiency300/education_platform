"""Геймификация: бейджи и XP-уровни.

Бейджи вычисляются «на лету» из текущего прогресса пользователя.
Никаких отдельных таблиц — это даёт нам гибко править условия.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from sqlalchemy import func

from app.db.session import get_session
from app.db.models import Progress, User, ChatMessage, SimulatorSession, CourseProgress, CustomCourse
from app.simulator.scenarios import SCENARIOS
from app.courses.catalog import COURSES

router = APIRouter(prefix="/badges", tags=["badges"])


BADGE_DEFS = [
    {
        "id": "first_steps",
        "title": "Первые шаги",
        "description": "Завершили первый сценарий симулятора",
        "icon": "rocket",
    },
    {
        "id": "ai_curious",
        "title": "Любопытный",
        "description": "Задали 5 вопросов AI-наставнику",
        "icon": "sparkles",
    },
    {
        "id": "perfectionist",
        "title": "Перфекционист",
        "description": "Прошли сценарий на 100%",
        "icon": "trophy",
    },
    {
        "id": "marathoner",
        "title": "Марафонец",
        "description": "Прошли все доступные сценарии",
        "icon": "medal",
    },
    {
        "id": "scholar",
        "title": "Эрудит",
        "description": "Набрали более 200 баллов",
        "icon": "graduation-cap",
    },
    {
        "id": "course_master",
        "title": "Магистр курсов",
        "description": "Завершили все обучающие курсы",
        "icon": "book-open",
    },
]


class BadgeOut(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    earned: bool


class LevelInfo(BaseModel):
    level: int
    title: str
    xp: int
    xp_in_level: int
    xp_to_next: int
    progress_pct: float


class GamificationOut(BaseModel):
    level: LevelInfo
    badges: list[BadgeOut]


LEVEL_TITLES = ["Новичок", "Стажёр", "Специалист", "Эксперт", "Наставник", "Магистр"]
XP_PER_LEVEL = 100


def compute_level(xp: int) -> LevelInfo:
    level = min(xp // XP_PER_LEVEL, len(LEVEL_TITLES) - 1)
    xp_in_level = xp - level * XP_PER_LEVEL
    xp_to_next = XP_PER_LEVEL - xp_in_level if level < len(LEVEL_TITLES) - 1 else 0
    pct = (xp_in_level / XP_PER_LEVEL * 100) if level < len(LEVEL_TITLES) - 1 else 100.0
    return LevelInfo(
        level=level + 1,
        title=LEVEL_TITLES[level],
        xp=xp,
        xp_in_level=xp_in_level,
        xp_to_next=xp_to_next,
        progress_pct=round(pct, 1),
    )


@router.get("/{user_id}", response_model=GamificationOut)
async def get_gamification(user_id: int, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    progress_rows = (
        await db.scalars(select(Progress).where(Progress.user_id == user_id))
    ).all()
    total_xp = sum(p.points for p in progress_rows)

    chat_count = await db.scalar(
        select(func.count(ChatMessage.id)).where(
            ChatMessage.user_id == user_id, ChatMessage.role == "user"
        )
    ) or 0

    finished_sessions = (
        await db.scalars(
            select(SimulatorSession).where(
                SimulatorSession.user_id == user_id,
                SimulatorSession.finished.is_(True),
            )
        )
    ).all()

    has_perfect = any(
        s.score == _scenario_max(s.scenario_id) for s in finished_sessions
    )
    finished_scenario_ids = {s.scenario_id for s in finished_sessions if s.finished}

    completed_courses = (
        await db.scalars(
            select(CourseProgress).where(
                CourseProgress.user_id == user_id,
                CourseProgress.completed_at.is_not(None),
            )
        )
    ).all()
    completed_course_slugs = {c.course_slug for c in completed_courses}

    custom_slugs = {
        r for (r,) in (await db.execute(select(CustomCourse.slug))).all()
    }
    all_course_slugs = set(COURSES.keys()) | custom_slugs

    earned = {
        "first_steps": len(finished_sessions) >= 1,
        "ai_curious": chat_count >= 5,
        "perfectionist": has_perfect,
        "marathoner": finished_scenario_ids >= set(SCENARIOS.keys()),
        "scholar": total_xp >= 200,
        "course_master": all_course_slugs and completed_course_slugs >= all_course_slugs,
    }

    badges = [BadgeOut(**b, earned=earned.get(b["id"], False)) for b in BADGE_DEFS]
    return GamificationOut(level=compute_level(total_xp), badges=badges)


def _scenario_max(scenario_id: str) -> int:
    sc = SCENARIOS.get(scenario_id)
    if not sc:
        return 0
    return sum(max(o["points"] for o in s["options"]) for s in sc["steps"])
