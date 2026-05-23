"""Teams + group chat + content translation.

The group chat is the mechanism by which senior colleagues' knowledge gets
turned into knowledge-base entries: a newcomer asks a question, a senior
answers, and any team senior (or admin) can mark the answer as *canonical*.
Canonical answers are exported as Markdown into the knowledge-base directory
and indexed by BM25, so they immediately start showing up in AI-assistant
replies and become eligible source material for quiz generation.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.llm import translate_text
from app.ai.rag import rag_index
from app.core.config import settings
from app.core.deps import current_user, require_role
from app.db.activity import log_activity
from app.db.models import Team, TeamMembership, TeamMessage, User
from app.db.session import get_session


router = APIRouter(tags=["teams"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class TeamOut(BaseModel):
    id: int
    name: str
    description: str
    member_count: int
    my_role: Literal["newcomer", "member", "senior", "none"] = "none"


class TeamCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    description: str = ""
    member_user_ids: list[int] = []


class TeamMemberOut(BaseModel):
    user_id: int
    full_name: str
    email: str
    job_title: str
    avatar_url: str
    seniority: Literal["newcomer", "member", "senior"]


class TeamMembershipUpdate(BaseModel):
    user_id: int
    seniority: Literal["newcomer", "member", "senior"]


class TeamMessageOut(BaseModel):
    id: int
    parent_id: int | None
    author_id: int
    author_name: str
    author_avatar: str
    author_seniority: Literal["newcomer", "member", "senior"]
    content: str
    kind: Literal["message", "question"]
    canonical: bool
    knowledge_filename: str
    created_at: datetime


class TeamMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    parent_id: int | None = None
    kind: Literal["message", "question"] = "message"


class TranslateRequest(BaseModel):
    text: str
    target_lang: Literal["ru", "uz", "en"]


class TranslateBulkRequest(BaseModel):
    """For translating a course in one call. Keys are arbitrary slugs the
    caller wants back; values are the source strings."""

    target_lang: Literal["ru", "uz", "en"]
    items: dict[str, str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_filename_stem(text: str) -> str:
    stem = re.sub(r"[^A-Za-zА-Яа-я0-9_\-]+", "_", text)[:60].strip("_")
    return stem or "team_answer"


async def _seniority_for(db: AsyncSession, team_id: int, user_id: int) -> str:
    row = await db.scalar(
        select(TeamMembership).where(
            and_(TeamMembership.team_id == team_id, TeamMembership.user_id == user_id)
        )
    )
    return row.seniority if row else "none"


async def _ensure_membership(db: AsyncSession, team_id: int, user: User) -> TeamMembership:
    membership = await db.scalar(
        select(TeamMembership).where(
            and_(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        )
    )
    if membership:
        return membership
    if user.role in ("hr", "admin"):
        # HR/admins can read every team — give them a transparent "senior" view
        # without persisting a membership row.
        return TeamMembership(team_id=team_id, user_id=user.id, seniority="senior")
    raise HTTPException(403, "Вы не состоите в этой команде")


def _question_text_for(answer: TeamMessage, question: TeamMessage | None) -> str:
    if question is None:
        return "(вопрос не указан)"
    return question.content


async def _promote_to_knowledge_base(
    *,
    db: AsyncSession,
    answer: TeamMessage,
    team: Team,
) -> str:
    """Write a canonical answer to the knowledge-base directory and refresh
    the BM25 index. Returns the filename that was written."""
    question: TeamMessage | None = None
    if answer.parent_id:
        question = await db.get(TeamMessage, answer.parent_id)

    author = await db.get(User, answer.author_id)
    settings.regulations_path.mkdir(parents=True, exist_ok=True)

    base_stem = _safe_filename_stem(
        (question.content if question else answer.content[:60])
    )
    filename = f"team-{team.id}-{answer.id}-{base_stem}.md"
    path = settings.regulations_path / filename
    body = (
        f"# {question.content if question else 'Команда: ' + team.name}\n\n"
        f"**Команда:** {team.name}\n"
        f"**Эксперт:** {author.full_name if author else 'неизвестен'}"
        f"{(' · ' + author.job_title) if author and author.job_title else ''}\n"
        f"**Дата:** {answer.created_at.strftime('%Y-%m-%d')}\n\n"
        f"## Вопрос\n\n{_question_text_for(answer, question)}\n\n"
        f"## Ответ\n\n{answer.content}\n"
    )
    path.write_text(body, encoding="utf-8")
    rag_index.load_dir(settings.regulations_path)
    return filename


# ---------------------------------------------------------------------------
# Teams CRUD
# ---------------------------------------------------------------------------


@router.get("/teams", response_model=list[TeamOut])
async def list_teams(
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    teams = (await db.scalars(select(Team).order_by(Team.name))).all()
    out: list[TeamOut] = []
    for team in teams:
        members = (
            await db.scalars(select(TeamMembership).where(TeamMembership.team_id == team.id))
        ).all()
        mine = next((m for m in members if m.user_id == user.id), None)
        my_role: Literal["newcomer", "member", "senior", "none"] = (
            mine.seniority if mine else ("senior" if user.role in ("hr", "admin") else "none")
        )
        out.append(
            TeamOut(
                id=team.id,
                name=team.name,
                description=team.description,
                member_count=len(members),
                my_role=my_role,
            )
        )
    return out


@router.post(
    "/teams",
    response_model=TeamOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def create_team(
    payload: TeamCreateRequest,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    existing = await db.scalar(select(Team).where(Team.name == payload.name))
    if existing:
        raise HTTPException(409, "Команда с таким названием уже существует")
    team = Team(name=payload.name, description=payload.description)
    db.add(team)
    await db.flush()
    # Seed memberships from the payload — the creator is added automatically
    # as a senior so they can immediately mark canonical answers.
    seeded_ids: set[int] = set()
    if user.id not in payload.member_user_ids:
        db.add(TeamMembership(team_id=team.id, user_id=user.id, seniority="senior"))
        seeded_ids.add(user.id)
    for uid in payload.member_user_ids:
        if uid in seeded_ids:
            continue
        db.add(
            TeamMembership(
                team_id=team.id,
                user_id=uid,
                seniority="senior" if uid == user.id else "member",
            )
        )
        seeded_ids.add(uid)
    await db.commit()
    await db.refresh(team)
    return TeamOut(
        id=team.id,
        name=team.name,
        description=team.description,
        member_count=len(seeded_ids),
        my_role="senior",
    )


@router.get("/teams/{team_id}/members", response_model=list[TeamMemberOut])
async def team_members(
    team_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команда не найдена")
    await _ensure_membership(db, team_id, user)
    rows = (
        await db.scalars(
            select(TeamMembership).where(TeamMembership.team_id == team_id)
        )
    ).all()
    if not rows:
        return []
    users_by_id = {
        u.id: u
        for u in (
            await db.scalars(select(User).where(User.id.in_([r.user_id for r in rows])))
        ).all()
    }
    return [
        TeamMemberOut(
            user_id=r.user_id,
            full_name=users_by_id[r.user_id].full_name if r.user_id in users_by_id else "—",
            email=users_by_id[r.user_id].email if r.user_id in users_by_id else "",
            job_title=users_by_id[r.user_id].job_title if r.user_id in users_by_id else "",
            avatar_url=users_by_id[r.user_id].avatar_url if r.user_id in users_by_id else "",
            seniority=r.seniority,  # type: ignore[arg-type]
        )
        for r in rows
    ]


@router.post(
    "/teams/{team_id}/members",
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def update_team_member(
    team_id: int,
    payload: TeamMembershipUpdate,
    db: AsyncSession = Depends(get_session),
):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команда не найдена")
    target_user = await db.get(User, payload.user_id)
    if not target_user:
        raise HTTPException(404, "Пользователь не найден")
    row = await db.scalar(
        select(TeamMembership).where(
            and_(TeamMembership.team_id == team_id, TeamMembership.user_id == payload.user_id)
        )
    )
    if row:
        row.seniority = payload.seniority
    else:
        db.add(
            TeamMembership(team_id=team_id, user_id=payload.user_id, seniority=payload.seniority)
        )
    await db.commit()
    return {"ok": True}


@router.post("/teams/{team_id}/join")
async def join_team(
    team_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Self-service: any signed-in user can join a team as a newcomer.
    Seniority is set by an admin/HR later via update_team_member()."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команда не найдена")
    existing = await db.scalar(
        select(TeamMembership).where(
            and_(TeamMembership.team_id == team_id, TeamMembership.user_id == user.id)
        )
    )
    if existing:
        return {"ok": True, "seniority": existing.seniority}
    db.add(TeamMembership(team_id=team_id, user_id=user.id, seniority="newcomer"))
    await db.commit()
    return {"ok": True, "seniority": "newcomer"}


@router.delete(
    "/teams/{team_id}/members/{user_id}",
    dependencies=[Depends(require_role("admin", "hr"))],
)
async def remove_team_member(
    team_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_session),
):
    row = await db.scalar(
        select(TeamMembership).where(
            and_(TeamMembership.team_id == team_id, TeamMembership.user_id == user_id)
        )
    )
    if not row:
        raise HTTPException(404, "Участник не найден")
    await db.delete(row)
    await db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Group chat
# ---------------------------------------------------------------------------


@router.get("/teams/{team_id}/messages", response_model=list[TeamMessageOut])
async def list_messages(
    team_id: int,
    limit: int = 100,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команда не найдена")
    await _ensure_membership(db, team_id, user)
    rows = (
        await db.scalars(
            select(TeamMessage)
            .where(TeamMessage.team_id == team_id)
            .order_by(TeamMessage.created_at.asc())
            .limit(max(1, min(500, limit)))
        )
    ).all()
    if not rows:
        return []
    authors = {
        u.id: u
        for u in (
            await db.scalars(select(User).where(User.id.in_([r.author_id for r in rows])))
        ).all()
    }
    memberships = {
        m.user_id: m.seniority
        for m in (
            await db.scalars(
                select(TeamMembership).where(TeamMembership.team_id == team_id)
            )
        ).all()
    }
    return [
        TeamMessageOut(
            id=r.id,
            parent_id=r.parent_id,
            author_id=r.author_id,
            author_name=authors[r.author_id].full_name if r.author_id in authors else "—",
            author_avatar=authors[r.author_id].avatar_url if r.author_id in authors else "",
            author_seniority=memberships.get(r.author_id, "member"),  # type: ignore[arg-type]
            content=r.content,
            kind=r.kind,  # type: ignore[arg-type]
            canonical=r.canonical,
            knowledge_filename=r.knowledge_filename,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post(
    "/teams/{team_id}/messages",
    response_model=TeamMessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def post_message(
    team_id: int,
    payload: TeamMessageCreate,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команда не найдена")
    membership = await _ensure_membership(db, team_id, user)
    if payload.parent_id is not None:
        parent = await db.get(TeamMessage, payload.parent_id)
        if not parent or parent.team_id != team_id:
            raise HTTPException(400, "Некорректный parent_id")
    msg = TeamMessage(
        team_id=team_id,
        author_id=user.id,
        parent_id=payload.parent_id,
        kind=payload.kind,
        content=payload.content.strip(),
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return TeamMessageOut(
        id=msg.id,
        parent_id=msg.parent_id,
        author_id=msg.author_id,
        author_name=user.full_name,
        author_avatar=user.avatar_url,
        author_seniority=membership.seniority,  # type: ignore[arg-type]
        content=msg.content,
        kind=msg.kind,  # type: ignore[arg-type]
        canonical=msg.canonical,
        knowledge_filename=msg.knowledge_filename,
        created_at=msg.created_at,
    )


@router.post("/teams/{team_id}/messages/{message_id}/canonical")
async def mark_canonical(
    team_id: int,
    message_id: int,
    db: AsyncSession = Depends(get_session),
    user: User = Depends(current_user),
):
    """Promote an answer into the knowledge base. Only seniors / admins / HR
    can do this — newcomers can't grade their own answers."""
    team = await db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команда не найдена")
    seniority = await _seniority_for(db, team_id, user.id)
    if seniority != "senior" and user.role not in ("hr", "admin"):
        raise HTTPException(403, "Только старшие могут отмечать канонические ответы")
    msg = await db.get(TeamMessage, message_id)
    if not msg or msg.team_id != team_id:
        raise HTTPException(404, "Сообщение не найдено")
    if msg.canonical:
        return {"ok": True, "knowledge_filename": msg.knowledge_filename}
    msg.canonical = True
    filename = await _promote_to_knowledge_base(db=db, answer=msg, team=team)
    msg.knowledge_filename = filename
    await log_activity(
        db,
        user_id=user.id,
        kind="team_answer_canonical",
        title=f"Канонический ответ из команды «{team.name}»",
        detail=f"file={filename}",
    )
    await db.commit()
    return {"ok": True, "knowledge_filename": filename}


# ---------------------------------------------------------------------------
# Content translation (used by the course/lesson view for "Translate" button)
# ---------------------------------------------------------------------------


@router.post("/translate")
async def translate(payload: TranslateRequest, user: User = Depends(current_user)):
    out = await translate_text(payload.text, target_lang=payload.target_lang)
    return {"text": out, "target_lang": payload.target_lang}


@router.post("/translate/bulk")
async def translate_bulk(payload: TranslateBulkRequest, user: User = Depends(current_user)):
    """Translate many strings in one request. Each value is translated in
    isolation; callers should batch related strings together (one lesson at a
    time, say) so the overall round-trip stays small."""
    out: dict[str, str] = {}
    for key, src in payload.items.items():
        out[key] = await translate_text(src, target_lang=payload.target_lang)
    return {"items": out, "target_lang": payload.target_lang}
