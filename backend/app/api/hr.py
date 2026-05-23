"""HR-интерфейс: обзор команды, профили, лидерборд, аналитика.

Доступен только пользователям с ролью `hr` и `admin`.
"""
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm import generate_competency_assessment
from app.core.deps import require_role
from app.courses.catalog import COURSES
from app.db.models import (
    ActivityEvent,
    ChatMessage,
    CourseProgress,
    LessonProgress,
    Progress,
    SimulatorSession,
    User,
)
from app.db.session import get_session
from app.simulator.scenarios import SCENARIOS

router = APIRouter(
    prefix="/hr",
    tags=["hr"],
    dependencies=[Depends(require_role("hr", "admin"))],
)


# ---------------------------------------------------------------------------
# schemas
# ---------------------------------------------------------------------------


class TeamMember(BaseModel):
    id: int
    employee_id: str
    full_name: str
    email: str
    role: str
    position: str
    department: str
    program: str
    total_xp: int
    level: int
    overall_completion_pct: float
    courses_done: int
    courses_total: int
    scenarios_done: int
    scenarios_total: int
    last_activity_at: datetime | None
    status: str  # not_started | onboarding | progressing | ready | excellent


class CourseSnapshot(BaseModel):
    slug: str
    title: str
    completed: bool
    lessons_completed: int
    lessons_total: int
    quiz_score: int
    quiz_max: int
    quiz_attempts: int


class ScenarioSnapshot(BaseModel):
    scenario_id: str
    title: str
    best_pct: float
    best_score: int
    attempts: int


class ActivityBrief(BaseModel):
    kind: str
    title: str
    detail: str
    points: int
    created_at: datetime


class AICompetency(BaseModel):
    score: int                  # 0..100
    summary: str
    strengths: list[str]
    gaps: list[str]
    recommendation: str
    mode: str                   # mock | live


class UserProfile(BaseModel):
    user: TeamMember
    courses: list[CourseSnapshot]
    scenarios: list[ScenarioSnapshot]
    activity: list[ActivityBrief]
    chat_questions: int
    competency: AICompetency


class LeaderboardItem(BaseModel):
    rank: int
    user_id: int
    full_name: str
    department: str
    total_xp: int
    level: int
    courses_done: int
    scenarios_done: int
    last_activity_at: datetime | None


class AnalyticsBucket(BaseModel):
    key: str
    label: str
    value: float


class Analytics(BaseModel):
    total_users: int
    active_last_7d: int
    avg_completion_pct: float
    avg_xp: float
    course_completion: list[AnalyticsBucket]
    scenario_completion: list[AnalyticsBucket]
    xp_distribution: list[AnalyticsBucket]
    activity_last_14d: list[AnalyticsBucket]


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


XP_PER_LEVEL = 100
TOTAL_UNITS = max(len(COURSES) + len(SCENARIOS), 1)


def _status_for(total_xp: int, courses_done: int, scenarios_done: int, last_activity: datetime | None) -> str:
    if total_xp == 0:
        return "not_started"
    if courses_done == len(COURSES) and scenarios_done == len(SCENARIOS):
        return "excellent"
    if scenarios_done >= 1 and courses_done >= 1:
        return "ready"
    if courses_done >= 1 or scenarios_done >= 1:
        return "progressing"
    return "onboarding"


async def _team_overview(db: AsyncSession) -> list[TeamMember]:
    users = (await db.scalars(select(User).where(User.role == "user").order_by(User.full_name))).all()
    if not users:
        return []
    user_ids = [u.id for u in users]

    progress_rows = (
        await db.scalars(select(Progress).where(Progress.user_id.in_(user_ids)))
    ).all()
    by_user_progress: dict[int, list[Progress]] = defaultdict(list)
    for p in progress_rows:
        by_user_progress[p.user_id].append(p)

    course_rows = (
        await db.scalars(
            select(CourseProgress).where(
                CourseProgress.user_id.in_(user_ids),
                CourseProgress.completed_at.is_not(None),
            )
        )
    ).all()
    courses_done_by: dict[int, int] = defaultdict(int)
    for c in course_rows:
        courses_done_by[c.user_id] += 1

    sim_rows = (
        await db.scalars(
            select(SimulatorSession).where(
                SimulatorSession.user_id.in_(user_ids),
                SimulatorSession.finished.is_(True),
            )
        )
    ).all()
    scenarios_done_by: dict[int, set[str]] = defaultdict(set)
    for s in sim_rows:
        scenarios_done_by[s.user_id].add(s.scenario_id)

    last_activity_rows = (
        await db.execute(
            select(ActivityEvent.user_id, func.max(ActivityEvent.created_at))
            .where(ActivityEvent.user_id.in_(user_ids))
            .group_by(ActivityEvent.user_id)
        )
    ).all()
    last_activity_by: dict[int, datetime] = {row[0]: row[1] for row in last_activity_rows}

    out: list[TeamMember] = []
    for u in users:
        prs = by_user_progress.get(u.id, [])
        total_xp = sum(p.points for p in prs)
        overall = sum(p.completion_pct for p in prs) / TOTAL_UNITS if prs else 0.0
        cdone = courses_done_by.get(u.id, 0)
        sdone = len(scenarios_done_by.get(u.id, set()))
        last_at = last_activity_by.get(u.id)
        out.append(
            TeamMember(
                id=u.id,
                employee_id=u.employee_id,
                full_name=u.full_name,
                email=u.email,
                role=u.role,
                position=u.position,
                department=u.department,
                program=u.program,
                total_xp=total_xp,
                level=min(total_xp // XP_PER_LEVEL + 1, 6),
                overall_completion_pct=round(overall, 1),
                courses_done=cdone,
                courses_total=len(COURSES),
                scenarios_done=sdone,
                scenarios_total=len(SCENARIOS),
                last_activity_at=last_at,
                status=_status_for(total_xp, cdone, sdone, last_at),
            )
        )
    return out


# ---------------------------------------------------------------------------
# endpoints
# ---------------------------------------------------------------------------


@router.get("/team", response_model=list[TeamMember])
async def hr_team(db: AsyncSession = Depends(get_session)):
    return await _team_overview(db)


@router.get("/leaderboard", response_model=list[LeaderboardItem])
async def hr_leaderboard(limit: int = 10, db: AsyncSession = Depends(get_session)):
    team = await _team_overview(db)
    team_sorted = sorted(team, key=lambda m: (-m.total_xp, -m.overall_completion_pct, m.full_name))[:limit]
    return [
        LeaderboardItem(
            rank=i + 1,
            user_id=m.id,
            full_name=m.full_name,
            department=m.department,
            total_xp=m.total_xp,
            level=m.level,
            courses_done=m.courses_done,
            scenarios_done=m.scenarios_done,
            last_activity_at=m.last_activity_at,
        )
        for i, m in enumerate(team_sorted)
    ]


@router.get("/users/{user_id}", response_model=UserProfile)
async def hr_user_profile(user_id: int, db: AsyncSession = Depends(get_session)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")

    progress_rows = (
        await db.scalars(select(Progress).where(Progress.user_id == user_id))
    ).all()
    course_progress_rows = (
        await db.scalars(select(CourseProgress).where(CourseProgress.user_id == user_id))
    ).all()
    course_progress_by_slug = {c.course_slug: c for c in course_progress_rows}

    lesson_rows = (
        await db.scalars(select(LessonProgress).where(LessonProgress.user_id == user_id))
    ).all()
    lessons_by_course: dict[str, int] = defaultdict(int)
    for l in lesson_rows:
        lessons_by_course[l.course_slug] += 1

    courses_snapshot: list[CourseSnapshot] = []
    for slug, c in COURSES.items():
        cp = course_progress_by_slug.get(slug)
        courses_snapshot.append(
            CourseSnapshot(
                slug=slug,
                title=c["title"],
                completed=bool(cp and cp.completed_at),
                lessons_completed=lessons_by_course.get(slug, 0),
                lessons_total=len(c["lessons"]),
                quiz_score=cp.quiz_score if cp else 0,
                quiz_max=cp.quiz_max if cp else len(c["quiz"]),
                quiz_attempts=cp.quiz_attempts if cp else 0,
            )
        )

    sim_rows = (
        await db.scalars(
            select(SimulatorSession).where(SimulatorSession.user_id == user_id)
        )
    ).all()
    scenarios_snapshot: list[ScenarioSnapshot] = []
    for scenario_id, scenario in SCENARIOS.items():
        attempts = [s for s in sim_rows if s.scenario_id == scenario_id]
        max_pts = sum(max(o["points"] for o in st["options"]) for st in scenario["steps"]) or 1
        best_score = max((s.score for s in attempts), default=0)
        best_pct = round(best_score / max_pts * 100.0, 1)
        scenarios_snapshot.append(
            ScenarioSnapshot(
                scenario_id=scenario_id,
                title=scenario["title"],
                best_pct=best_pct,
                best_score=best_score,
                attempts=len(attempts),
            )
        )

    activity_rows = (
        await db.scalars(
            select(ActivityEvent)
            .where(ActivityEvent.user_id == user_id)
            .order_by(ActivityEvent.id.desc())
            .limit(20)
        )
    ).all()

    chat_questions = await db.scalar(
        select(func.count(ChatMessage.id)).where(
            ChatMessage.user_id == user_id, ChatMessage.role == "user"
        )
    ) or 0

    total_xp = sum(p.points for p in progress_rows)
    overall = sum(p.completion_pct for p in progress_rows) / TOTAL_UNITS if progress_rows else 0.0
    cdone = sum(1 for cp in course_progress_rows if cp.completed_at)
    sdone = len({s.scenario_id for s in sim_rows if s.finished})
    last_at = activity_rows[0].created_at if activity_rows else None

    team_card = TeamMember(
        id=user.id,
        employee_id=user.employee_id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        position=user.position,
        department=user.department,
        program=user.program,
        total_xp=total_xp,
        level=min(total_xp // XP_PER_LEVEL + 1, 6),
        overall_completion_pct=round(overall, 1),
        courses_done=cdone,
        courses_total=len(COURSES),
        scenarios_done=sdone,
        scenarios_total=len(SCENARIOS),
        last_activity_at=last_at,
        status=_status_for(total_xp, cdone, sdone, last_at),
    )

    competency_dict = await generate_competency_assessment(
        user=user,
        total_xp=total_xp,
        overall_pct=team_card.overall_completion_pct,
        courses=[c.model_dump() for c in courses_snapshot],
        scenarios=[s.model_dump() for s in scenarios_snapshot],
        chat_questions=int(chat_questions),
    )
    competency = AICompetency(**competency_dict)

    return UserProfile(
        user=team_card,
        courses=courses_snapshot,
        scenarios=scenarios_snapshot,
        activity=[
            ActivityBrief(
                kind=a.kind, title=a.title, detail=a.detail or "", points=a.points, created_at=a.created_at
            )
            for a in activity_rows
        ],
        chat_questions=int(chat_questions),
        competency=competency,
    )


@router.get("/analytics", response_model=Analytics)
async def hr_analytics(db: AsyncSession = Depends(get_session)):
    team = await _team_overview(db)
    total_users = len(team)
    avg_completion = round(sum(m.overall_completion_pct for m in team) / total_users, 1) if total_users else 0.0
    avg_xp = round(sum(m.total_xp for m in team) / total_users, 1) if total_users else 0.0

    # активность за 14 дней
    since = datetime.utcnow() - timedelta(days=14)
    events = (
        await db.scalars(
            select(ActivityEvent).where(ActivityEvent.created_at >= since)
        )
    ).all()
    active_user_ids_7d = {
        e.user_id for e in events if e.created_at >= datetime.utcnow() - timedelta(days=7)
    }

    # buckets для XP-распределения
    xp_buckets = [
        ("0", "0 XP", 0, 0),
        ("1-99", "1–99 XP", 1, 99),
        ("100-249", "100–249 XP", 100, 249),
        ("250-499", "250–499 XP", 250, 499),
        ("500+", "500+ XP", 500, 10**9),
    ]
    xp_distribution = []
    for key, label, lo, hi in xp_buckets:
        cnt = sum(1 for m in team if lo <= m.total_xp <= hi)
        xp_distribution.append(AnalyticsBucket(key=key, label=label, value=float(cnt)))

    # completion по курсам
    course_completion: list[AnalyticsBucket] = []
    for slug, c in COURSES.items():
        if not total_users:
            pct = 0.0
        else:
            done = (
                await db.scalar(
                    select(func.count(CourseProgress.id)).where(
                        CourseProgress.course_slug == slug,
                        CourseProgress.completed_at.is_not(None),
                    )
                )
            ) or 0
            pct = round(done / total_users * 100.0, 1)
        course_completion.append(AnalyticsBucket(key=slug, label=c["title"], value=pct))

    # completion по сценариям
    scenario_completion: list[AnalyticsBucket] = []
    for sid, scenario in SCENARIOS.items():
        if not total_users:
            pct = 0.0
        else:
            done = (
                await db.scalar(
                    select(func.count(func.distinct(SimulatorSession.user_id))).where(
                        SimulatorSession.scenario_id == sid,
                        SimulatorSession.finished.is_(True),
                    )
                )
            ) or 0
            pct = round(done / total_users * 100.0, 1)
        scenario_completion.append(AnalyticsBucket(key=sid, label=scenario["title"], value=pct))

    # активность по дням (последние 14)
    by_day: dict[str, int] = defaultdict(int)
    for ev in events:
        by_day[ev.created_at.strftime("%Y-%m-%d")] += 1
    days = []
    for i in range(13, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        days.append(AnalyticsBucket(key=d, label=d[5:], value=float(by_day.get(d, 0))))

    return Analytics(
        total_users=total_users,
        active_last_7d=len(active_user_ids_7d),
        avg_completion_pct=avg_completion,
        avg_xp=avg_xp,
        course_completion=course_completion,
        scenario_completion=scenario_completion,
        xp_distribution=xp_distribution,
        activity_last_14d=days,
    )


# ---------------------------------------------------------------------------
# AI chat history visibility for HR/admin
# ---------------------------------------------------------------------------


class HRChatThread(BaseModel):
    user_id: int
    full_name: str
    email: str
    department: str
    message_count: int
    last_message_at: datetime | None
    last_question: str


@router.get("/chats", response_model=list[HRChatThread])
async def hr_chat_list(db: AsyncSession = Depends(get_session)):
    """One row per user that's interacted with the AI assistant — message
    count, latest activity and a preview of their last question."""
    msgs = (
        await db.scalars(
            select(ChatMessage)
            .where(ChatMessage.deleted.is_(False) if hasattr(ChatMessage, "deleted") else True)  # type: ignore[arg-type]
            .order_by(ChatMessage.created_at.desc())
        )
    ).all()
    bucket: dict[int, list[ChatMessage]] = defaultdict(list)
    for m in msgs:
        bucket[m.user_id].append(m)
    if not bucket:
        return []
    users = (await db.scalars(select(User).where(User.id.in_(bucket.keys())))).all()
    by_id = {u.id: u for u in users}
    out: list[HRChatThread] = []
    for uid, items in bucket.items():
        u = by_id.get(uid)
        if not u:
            continue
        items.sort(key=lambda x: x.created_at, reverse=True)
        last_q = next((m.content for m in items if m.role == "user"), items[0].content)
        out.append(
            HRChatThread(
                user_id=uid,
                full_name=u.full_name,
                email=u.email,
                department=u.department or "",
                message_count=len(items),
                last_message_at=items[0].created_at,
                last_question=(last_q or "")[:200],
            )
        )
    out.sort(key=lambda t: t.last_message_at or datetime.min, reverse=True)
    return out


class HRChatHistoryItem(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime


@router.get("/chats/{user_id}/messages", response_model=list[HRChatHistoryItem])
async def hr_chat_history(user_id: int, db: AsyncSession = Depends(get_session)):
    rows = (
        await db.scalars(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .where(ChatMessage.deleted.is_(False) if hasattr(ChatMessage, "deleted") else True)  # type: ignore[arg-type]
            .order_by(ChatMessage.created_at.asc())
        )
    ).all()
    return [
        HRChatHistoryItem(id=r.id, role=r.role, content=r.content, created_at=r.created_at)
        for r in rows
    ]
