"""Импорт сотрудников из HR-системы.

Реализованы два варианта:
- POST /api/hr/import/json — батч-импорт списком JSON
- POST /api/hr/import/csv  — загрузка CSV-файла

В обоих случаях upsert по employee_id.
"""
import csv
import io
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import User
from app.schemas.users import UserCreate

log = logging.getLogger("app.hr")
router = APIRouter(prefix="/hr", tags=["hr-import"])


class ImportSummary(BaseModel):
    received: int
    created: int
    updated: int
    errors: list[str] = []


async def _upsert(db: AsyncSession, payload: UserCreate) -> str:
    existing = await db.scalar(
        select(User).where(User.employee_id == payload.employee_id)
    )
    if existing:
        existing.full_name = payload.full_name
        if payload.position:
            existing.position = payload.position
        existing.department = payload.department
        existing.program = payload.program
        return "updated"
    data = payload.model_dump()
    if not data.get("email"):
        data["email"] = f"{payload.employee_id.lower()}@imported.turonbank.uz"
    db.add(User(**data))
    return "created"


@router.post("/import/json", response_model=ImportSummary)
async def import_json(
    payload: list[UserCreate], db: AsyncSession = Depends(get_session)
):
    created = updated = 0
    errors: list[str] = []
    for i, u in enumerate(payload):
        try:
            result = await _upsert(db, u)
            if result == "created":
                created += 1
            else:
                updated += 1
        except Exception as e:  # noqa: BLE001
            errors.append(f"row {i}: {e}")
    await db.commit()
    log.info("hr import json: created=%s updated=%s errors=%s", created, updated, len(errors))
    return ImportSummary(received=len(payload), created=created, updated=updated, errors=errors)


@router.post("/import/csv", response_model=ImportSummary)
async def import_csv(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_session)
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Ожидается CSV-файл")

    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))
    required = {"employee_id", "full_name"}
    if not reader.fieldnames or not required.issubset({c.strip() for c in reader.fieldnames}):
        raise HTTPException(
            400,
            f"CSV должен содержать колонки: {', '.join(sorted(required))} "
            f"(опционально: role, department, program)",
        )

    created = updated = 0
    errors: list[str] = []
    received = 0
    for i, row in enumerate(reader):
        received += 1
        try:
            user = UserCreate(
                employee_id=row["employee_id"].strip(),
                full_name=row["full_name"].strip(),
                role="user",
                position=(row.get("position") or row.get("role") or "intern").strip(),
                department=(row.get("department") or "").strip(),
                program=(row.get("program") or "").strip(),
            )
            result = await _upsert(db, user)
            if result == "created":
                created += 1
            else:
                updated += 1
        except Exception as e:  # noqa: BLE001
            errors.append(f"row {i+2}: {e}")  # +2: header + 1-based
    await db.commit()
    log.info("hr import csv: created=%s updated=%s errors=%s", created, updated, len(errors))
    return ImportSummary(received=received, created=created, updated=updated, errors=errors)
