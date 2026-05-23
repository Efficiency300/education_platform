import os
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Тесты должны иметь свою временную SQLite — изолированно от dev-БД.
TMP_DB = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TMP_DB.name}"
os.environ["ANTHROPIC_API_KEY"] = ""  # mock-режим
os.environ["REGULATIONS_DIR"] = "./data/regulations"


@pytest_asyncio.fixture
async def client():
    from app.main import app, lifespan

    async with lifespan(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c


@pytest_asyncio.fixture
async def user_id(client, request):
    # уникальный пользователь на каждый тест — чтобы не текли XP/прогресс между тестами
    eid = f"TEST-{abs(hash(request.node.nodeid)) % 10_000_000:07d}"
    res = await client.post(
        "/api/users",
        json={
            "employee_id": eid,
            "email": f"{eid.lower()}@qa.kompas.uz",
            "full_name": "Test User",
            "role": "user",
            "position": "intern",
            "department": "QA",
            "program": "test",
        },
    )
    assert res.status_code == 200, res.text
    return res.json()["id"]
