from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


db_path = Path("./data")
db_path.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(settings.database_url, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


# Columns we've added to existing tables after the initial release. SQLAlchemy
# create_all() only creates missing tables, never alters existing ones, so we
# patch them in by hand for the dev SQLite database.
_ADDITIVE_COLUMNS: dict[str, dict[str, str]] = {
    "users": {
        "job_title": "VARCHAR(128) DEFAULT ''",
        "avatar_url": "VARCHAR(512) DEFAULT ''",
        "directions": "JSON",
    },
    "custom_courses": {
        "directions": "JSON",
        "order_index": "INTEGER DEFAULT 0",
        "prerequisite_slug": "VARCHAR(128) DEFAULT ''",
    },
    "scenarios": {
        "directions": "JSON",
        "assigned_user_id": "INTEGER",
        "course_tags": "JSON",
    },
    "knowledge_files": {
        "directions": "JSON",
    },
    "chat_messages": {
        "deleted": "BOOLEAN DEFAULT 0",
        "deleted_by": "INTEGER",
    },
    "team_messages": {
        "deleted": "BOOLEAN DEFAULT 0",
        "deleted_by": "INTEGER",
    },
}


async def _migrate_additive_columns(conn) -> None:
    for table, cols in _ADDITIVE_COLUMNS.items():
        existing_rows = await conn.exec_driver_sql(f'PRAGMA table_info("{table}")')
        existing = {row[1] for row in existing_rows.fetchall()}
        for name, ddl in cols.items():
            if name in existing:
                continue
            await conn.exec_driver_sql(
                f'ALTER TABLE "{table}" ADD COLUMN {name} {ddl}'
            )


async def init_db() -> None:
    from app.db import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # SQLite-only additive migration. PostgreSQL deployments should run
        # Alembic, but the same ALTER TABLE works there too.
        if settings.database_url.startswith("sqlite"):
            await _migrate_additive_columns(conn)
