import pytest

from app.simulator.scenarios import SCENARIOS, max_score


@pytest.mark.asyncio
async def test_list_and_detail(client):
    res = await client.get("/api/simulator/scenarios")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == len(SCENARIOS)
    first_id = items[0]["id"]

    detail = await client.get(f"/api/simulator/scenarios/{first_id}")
    assert detail.status_code == 200
    assert detail.json()["steps"]


@pytest.mark.asyncio
async def test_perfect_run_updates_progress(client, user_id):
    scenario_id = "abs_customer_service"
    scenario = SCENARIOS[scenario_id]

    start = await client.post(
        "/api/simulator/sessions",
        json={"user_id": user_id, "scenario_id": scenario_id},
    )
    assert start.status_code == 200
    session_id = start.json()["id"]

    finished = False
    for step in scenario["steps"]:
        correct_option = next(o for o in step["options"] if o["correct"])
        res = await client.post(
            "/api/simulator/answer",
            json={
                "session_id": session_id,
                "step_id": step["id"],
                "option_id": correct_option["id"],
            },
        )
        assert res.status_code == 200
        body = res.json()
        assert body["correct"] is True
        finished = body["finished"]

    assert finished is True

    progress = await client.get(f"/api/progress/{user_id}")
    assert progress.status_code == 200
    pbody = progress.json()
    assert pbody["total_points"] == max_score(scenario)
    assert any(m["module"] == scenario_id and m["completion_pct"] == 100.0 for m in pbody["modules"])
