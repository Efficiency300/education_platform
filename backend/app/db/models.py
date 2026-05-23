from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON, Float, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, default="")
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    full_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="user")  # user | hr | admin
    position: Mapped[str] = mapped_column(String(64), default="intern")  # intern | employee
    department: Mapped[str] = mapped_column(String(128), default="")
    # Multi-direction membership. ``department`` is kept as the user's primary
    # direction (for legacy code); ``directions`` is the authoritative list
    # used for course / scenario / file visibility.
    directions: Mapped[list | None] = mapped_column(JSON, default=list)
    program: Mapped[str] = mapped_column(String(128), default="")
    # Free-form job grade — set by admin (e.g. "Senior Developer", "QA Lead").
    job_title: Mapped[str] = mapped_column(String(128), default="")
    # Avatar served from /static/uploads or an absolute URL.
    avatar_url: Mapped[str] = mapped_column(String(512), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    progress: Mapped[list["Progress"]] = relationship(back_populates="user", cascade="all, delete")
    sessions: Mapped[list["SimulatorSession"]] = relationship(back_populates="user", cascade="all, delete")
    lesson_progress: Mapped[list["LessonProgress"]] = relationship(back_populates="user", cascade="all, delete")
    course_progress: Mapped[list["CourseProgress"]] = relationship(back_populates="user", cascade="all, delete")
    activity: Mapped[list["ActivityEvent"]] = relationship(back_populates="user", cascade="all, delete")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(16))  # user | assistant
    content: Mapped[str] = mapped_column(Text)
    sources: Mapped[list | None] = mapped_column(JSON, nullable=True)
    # Admin soft-delete: keeps the row for audit while hiding it from the UI.
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Progress(Base):
    __tablename__ = "progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    module: Mapped[str] = mapped_column(String(128))  # e.g. "abs_customer_service"
    kind: Mapped[str] = mapped_column(String(32), default="simulator")  # simulator | course
    completion_pct: Mapped[float] = mapped_column(Float, default=0.0)
    points: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="progress")


class CourseProgress(Base):
    __tablename__ = "course_progress"
    __table_args__ = (UniqueConstraint("user_id", "course_slug", name="uq_course_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_slug: Mapped[str] = mapped_column(String(128), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    quiz_score: Mapped[int] = mapped_column(Integer, default=0)
    quiz_max: Mapped[int] = mapped_column(Integer, default=0)
    quiz_attempts: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="course_progress")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("user_id", "course_slug", "lesson_slug", name="uq_lesson_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_slug: Mapped[str] = mapped_column(String(128), index=True)
    lesson_slug: Mapped[str] = mapped_column(String(128))
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="lesson_progress")


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    kind: Mapped[str] = mapped_column(String(64))
    # course_started | lesson_completed | course_completed | quiz_passed |
    # scenario_started | scenario_completed | badge_earned | chat_asked | level_up
    title: Mapped[str] = mapped_column(String(255))
    detail: Mapped[str] = mapped_column(Text, default="")
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    points: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    user: Mapped["User"] = relationship(back_populates="activity")


class CustomCourse(Base):
    """Курс, добавленный администратором через UI.

    Полная структура (lessons + quiz) хранится как JSON — это гибче,
    чем дробить на десяток таблиц для MVP.
    """

    __tablename__ = "custom_courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    subtitle: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    icon: Mapped[str] = mapped_column(String(32), default="book")
    difficulty: Mapped[str] = mapped_column(String(16), default="easy")
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=10)
    target_scenario_id: Mapped[str] = mapped_column(String(64), default="")
    tags: Mapped[list | None] = mapped_column(JSON, default=list)
    # Directions (departments) this course is visible to. Empty = visible to all.
    directions: Mapped[list | None] = mapped_column(JSON, default=list)
    # Locks the course until ``prerequisite_slug`` has been completed.
    prerequisite_slug: Mapped[str] = mapped_column(String(128), default="")
    # Ordering used by the catalog page (low number first).
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    lessons: Mapped[list | None] = mapped_column(JSON, default=list)
    quiz: Mapped[list | None] = mapped_column(JSON, default=list)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class SimulatorSession(Base):
    __tablename__ = "simulator_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    scenario_id: Mapped[str] = mapped_column(String(64), index=True)
    state: Mapped[dict] = mapped_column(JSON, default=dict)
    score: Mapped[int] = mapped_column(Integer, default=0)
    finished: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="sessions")


# ---------------------------------------------------------------------------
# Teams + group chat (knowledge from senior colleagues)
# ---------------------------------------------------------------------------


class Team(Base):
    """A working team (e.g. "Backend", "QA"). Hosts a group chat where newcomers
    ask questions and seniors answer; admins promote the canonical answers
    into the knowledge base."""

    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    members: Mapped[list["TeamMembership"]] = relationship(
        back_populates="team", cascade="all, delete-orphan"
    )
    messages: Mapped[list["TeamMessage"]] = relationship(
        back_populates="team", cascade="all, delete-orphan"
    )


class TeamMembership(Base):
    """Maps users to teams + their seniority within that team."""

    __tablename__ = "team_memberships"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    # newcomer | member | senior — controls who can mark canonical answers
    seniority: Mapped[str] = mapped_column(String(32), default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped["Team"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()


class TeamMessage(Base):
    """One message in a team's group chat. ``parent_id`` lets replies attach to
    a specific question; the question + the answer marked as canonical are what
    we sync into the knowledge base."""

    __tablename__ = "team_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("team_messages.id", ondelete="SET NULL"), nullable=True, index=True
    )
    kind: Mapped[str] = mapped_column(String(16), default="message")  # message | question
    content: Mapped[str] = mapped_column(Text)
    # Set when a senior / admin marks this reply as the canonical answer.
    canonical: Mapped[bool] = mapped_column(Boolean, default=False)
    # Once promoted to the knowledge base, store the resulting filename so we
    # can avoid duplicates and remove the file if the message is deleted.
    knowledge_filename: Mapped[str] = mapped_column(String(255), default="")
    # Admin soft-delete: keeps the row for audit while hiding it from the UI.
    deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    team: Mapped["Team"] = relationship(back_populates="messages")
    author: Mapped["User"] = relationship(foreign_keys=[author_id])


# ---------------------------------------------------------------------------
# Норс — guided onboarding flow
# ---------------------------------------------------------------------------


class OnboardingFlow(Base):
    """A scripted onboarding journey ("Flow") that the Норс mascot walks a
    newcomer through. Each flow targets a department and contains an ordered
    list of steps.

    A step is a plain dict in JSON with at minimum:
      - ``id``     unique within the flow
      - ``kind``   "narrative" | "question" | "course"
      - ``text``   storytelling text shown by Норс
    Question steps add ``options`` (a list of dicts with ``id`` and
    ``label``) and ``correct_option_id``. Course steps add a ``course_slug``
    that links the user to a specific course."""

    __tablename__ = "onboarding_flows"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    department: Mapped[str] = mapped_column(String(128), default="")
    steps: Mapped[list | None] = mapped_column(JSON, default=list)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class UserFlowProgress(Base):
    """Per-user pointer into one flow plus the answers they've given so far."""

    __tablename__ = "user_flow_progress"
    __table_args__ = (UniqueConstraint("user_id", "flow_id", name="uq_user_flow"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("onboarding_flows.id", ondelete="CASCADE"), index=True)
    # Index of the next step the user needs to see. ``len(flow.steps)`` means done.
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    # Map of step_id → answer payload, used to remember which option a user
    # picked on each question step and feed it back into the narrative later.
    answers: Mapped[dict | None] = mapped_column(JSON, default=dict)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


# ---------------------------------------------------------------------------
# North — scenario-driven mascot bot
# ---------------------------------------------------------------------------


class Scenario(Base):
    """A scenario the North mascot walks newcomers through.

    The ``steps`` JSON column stores a list of step dicts, each with shape:
        {id, order, north_message, input_type, choices?, correct_answer?,
         north_state, on_complete_state, content_ref?}
    Keeping it as JSON keeps the dev velocity high — admins can add fields
    in the future without a migration.
    """

    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Public-facing identifier so URLs / dedupe checks don't expose the PK.
    scenario_uid: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(128), default="")
    # Multi-direction targeting. If non-empty, the scenario is visible to any
    # user whose ``directions`` list intersects with this one.
    directions: Mapped[list | None] = mapped_column(JSON, default=list)
    # If set, the scenario is bound to one specific user (admin-driven 1:1
    # assignment) — overrides direction matching.
    assigned_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    # "draft" | "published" — only published scenarios are visible to newcomers.
    status: Mapped[str] = mapped_column(String(16), default="draft")
    steps: Mapped[list | None] = mapped_column(JSON, default=list)
    # Slugs of courses tagged onto this scenario (admin "tag related courses").
    course_tags: Mapped[list | None] = mapped_column(JSON, default=list)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class UserScenarioProgress(Base):
    """Per-user pointer into one scenario. ``current_step`` equals
    ``len(steps)`` when the scenario has been completed."""

    __tablename__ = "user_scenario_progress"
    __table_args__ = (UniqueConstraint("user_id", "scenario_id", name="uq_user_scenario"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id", ondelete="CASCADE"), index=True)
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


# ---------------------------------------------------------------------------
# Knowledge base files (Qdrant-backed). One row per uploaded file; the chunk
# vectors live in Qdrant keyed by ``id`` so we can delete them on file
# removal without scanning the collection.
# ---------------------------------------------------------------------------


class Direction(Base):
    """Admin-managed list of "directions" (departments / functional areas).

    Used as the source of truth for the multi-select pickers wherever a
    direction is needed: user profile, course visibility, scenario targeting,
    knowledge files."""

    __tablename__ = "directions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class KnowledgeInstruction(Base):
    """An AI-auto-detected instruction promoted into the knowledge base.

    When the AI assistant produces an answer that looks like a reusable
    instruction, we keep a row here so admins can review / verify the source
    and delete it from the knowledge base if needed."""

    __tablename__ = "knowledge_instructions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    # JSON list of source citations (url, title, snippet) used to corroborate.
    sources: Mapped[list | None] = mapped_column(JSON, default=list)
    # "verified" if at least one trusted source confirmed; "unverified" otherwise.
    verification_status: Mapped[str] = mapped_column(String(32), default="unverified")
    verification_notes: Mapped[str] = mapped_column(Text, default="")
    # Backing markdown file in the knowledge base.
    knowledge_filename: Mapped[str] = mapped_column(String(255), default="")
    # Original chat message ids (free-form so AI/team flows can both feed it).
    origin: Mapped[str] = mapped_column(String(64), default="chat")
    origin_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    direction: Mapped[str] = mapped_column(String(128), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class KnowledgeFile(Base):
    __tablename__ = "knowledge_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    # Free-form direction / department this file belongs to ("Backend", "HR"…).
    # Empty string means "general / unclassified".
    direction: Mapped[str] = mapped_column(String(128), default="", index=True)
    # Multi-direction tagging. Authoritative list; ``direction`` kept for legacy.
    directions: Mapped[list | None] = mapped_column(JSON, default=list)
    title: Mapped[str] = mapped_column(String(255), default="")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    content_type: Mapped[str] = mapped_column(String(128), default="")
    # How many chunks we successfully upserted into Qdrant. Useful for the UI
    # to badge "indexed / partial / not indexed".
    vector_count: Mapped[int] = mapped_column(Integer, default=0)
    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
