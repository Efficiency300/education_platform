import pytest

from app.simulator.scenarios import SCENARIOS


@pytest.mark.asyncio
async def test_badges_initially_empty(client, user_id):
    res = await client.get(f"/api/badges/{user_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["level"]["level"] == 1
    assert body["level"]["xp"] == 0
    assert all(b["earned"] is False for b in body["badges"])


@pytest.mark.asyncio
async def test_badges_after_perfect_run(client, user_id):
    scenario_id = "abs_customer_service"
    scenario = SCENARIOS[scenario_id]
    start = await client.post(
        "/api/simulator/sessions",
        json={"user_id": user_id, "scenario_id": scenario_id},
    )
    session_id = start.json()["id"]
    for step in scenario["steps"]:
        correct = next(o for o in step["options"] if o["correct"])
        await client.post(
            "/api/simulator/answer",
            json={"session_id": session_id, "step_id": step["id"], "option_id": correct["id"]},
        )

    res = await client.get(f"/api/badges/{user_id}")
    body = res.json()
    earned = {b["id"]: b["earned"] for b in body["badges"]}
    assert earned["first_steps"] is True
    assert earned["perfectionist"] is True


@pytest.mark.asyncio
async def test_ispring_mock(client, user_id):
    res = await client.post("/api/ispring/sync", json={"user_id": user_id})
    assert res.status_code == 200
    body = res.json()
    assert body["mode"] == "mock"
    assert body["sent"]["employee_id"].startswith("TEST-")


@pytest.mark.asyncio
async def test_hr_import_csv(client):
    csv_text = (
        "employee_id,full_name,role,department,program\n"
        "EMP-100,Иванов Иван,intern,Розничный,Kelajakka qadam\n"
        "EMP-101,Петров Пётр,employee,IT,\n"
    ).encode("utf-8")

    res = await client.post(
        "/api/hr/import/csv",
        files={"file": ("hr.csv", csv_text, "text/csv")},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["received"] == 2
    assert body["created"] + body["updated"] == 2
