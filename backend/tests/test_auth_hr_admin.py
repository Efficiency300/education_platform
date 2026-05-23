import pytest


async def _login(client, email, password):
    res = await client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["token"]


def _bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_demo_accounts_can_login(client):
    for email, password, role in [
        ("user@turonbank.uz", "user12345", "user"),
        ("hr@turonbank.uz", "hr12345", "hr"),
        ("admin@turonbank.uz", "admin12345", "admin"),
    ]:
        token = await _login(client, email, password)
        me = await client.get("/api/auth/me", headers=_bearer(token))
        assert me.status_code == 200
        assert me.json()["role"] == role
        assert me.json()["email"] == email


@pytest.mark.asyncio
async def test_register_creates_user_role(client):
    payload = {
        "email": "newbie@turonbank.uz",
        "password": "newbie12345",
        "full_name": "Newbie Intern",
        "position": "intern",
        "department": "Розничный блок",
        "program": "Kelajakka qadam",
    }
    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["user"]["role"] == "user"
    assert body["user"]["email"] == payload["email"]
    assert body["token"]


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email(client):
    payload = {
        "email": "dup@turonbank.uz",
        "password": "dupdup12345",
        "full_name": "Dup",
    }
    r1 = await client.post("/api/auth/register", json=payload)
    assert r1.status_code == 200
    r2 = await client.post("/api/auth/register", json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_hr_endpoints_require_role(client):
    user_token = await _login(client, "user@turonbank.uz", "user12345")
    r = await client.get("/api/hr/team", headers=_bearer(user_token))
    assert r.status_code == 403

    hr_token = await _login(client, "hr@turonbank.uz", "hr12345")
    r = await client.get("/api/hr/team", headers=_bearer(hr_token))
    assert r.status_code == 200
    team = r.json()
    assert isinstance(team, list)
    assert any(u["email"] == "user@turonbank.uz" for u in team)


@pytest.mark.asyncio
async def test_hr_user_profile_has_competency(client):
    hr_token = await _login(client, "hr@turonbank.uz", "hr12345")
    team = (await client.get("/api/hr/team", headers=_bearer(hr_token))).json()
    target = next(u for u in team if u["email"] == "user@turonbank.uz")
    res = await client.get(f"/api/hr/users/{target['id']}", headers=_bearer(hr_token))
    assert res.status_code == 200
    body = res.json()
    assert "competency" in body
    assert 0 <= body["competency"]["score"] <= 100
    assert body["competency"]["mode"] in ("mock", "live")
    assert isinstance(body["courses"], list)
    assert isinstance(body["scenarios"], list)


@pytest.mark.asyncio
async def test_admin_can_create_and_delete_custom_course(client):
    admin_token = await _login(client, "admin@turonbank.uz", "admin12345")
    payload = {
        "slug": "test_custom_one",
        "title": "Тестовый курс",
        "subtitle": "Авто-тест",
        "description": "Описание",
        "icon": "book",
        "difficulty": "easy",
        "estimated_minutes": 5,
        "target_scenario_id": "abs_customer_service",
        "tags": ["test"],
        "lessons": [
            {"slug": "l1", "title": "Урок 1", "summary": "s", "duration_min": 2, "body_md": "## Hello"}
        ],
        "quiz": [
            {
                "id": "q1",
                "question": "2+2?",
                "options": [
                    {"id": "a", "text": "3", "correct": False},
                    {"id": "b", "text": "4", "correct": True},
                ],
                "explanation": "Арифметика",
            }
        ],
    }
    res = await client.post("/api/admin/courses", json=payload, headers=_bearer(admin_token))
    assert res.status_code == 201, res.text
    cid = res.json()["id"]

    # курс виден в общем каталоге
    lst = (await client.get("/api/courses")).json()
    assert any(c["slug"] == "test_custom_one" for c in lst)

    # detail отдаётся без правильных ответов
    detail = (await client.get("/api/courses/test_custom_one")).json()
    for q in detail["quiz"]:
        for o in q["options"]:
            assert "correct" not in o

    # admin может удалить
    res = await client.delete(f"/api/admin/courses/{cid}", headers=_bearer(admin_token))
    assert res.status_code == 200

    lst = (await client.get("/api/courses")).json()
    assert not any(c["slug"] == "test_custom_one" for c in lst)


@pytest.mark.asyncio
async def test_admin_stats(client):
    admin_token = await _login(client, "admin@turonbank.uz", "admin12345")
    res = await client.get("/api/admin/stats", headers=_bearer(admin_token))
    assert res.status_code == 200
    body = res.json()
    assert body["users_total"] >= 3
    assert body["users_by_role"].get("admin", 0) >= 1
    assert body["courses_built_in"] >= 3
    assert body["regulations_count"] >= 1


@pytest.mark.asyncio
async def test_non_admin_cannot_create_course(client):
    hr_token = await _login(client, "hr@turonbank.uz", "hr12345")
    res = await client.post(
        "/api/admin/courses",
        json={"slug": "x", "title": "x", "lessons": [], "quiz": []},
        headers=_bearer(hr_token),
    )
    assert res.status_code == 403
