import pytest

from app.courses.catalog import COURSES, course_xp_reward


@pytest.mark.asyncio
async def test_courses_index_overlay(client, user_id):
    res = await client.get(f"/api/courses?user_id={user_id}")
    assert res.status_code == 200
    items = res.json()
    # The test user is in "Call Center" direction. The catalog now contains
    # role-targeted courses (credit specialist, client manager, …) that aren't
    # visible to them — only courses with no directions or with "Call Center"
    # should land in the response.
    visible_slugs = {
        slug
        for slug, course in COURSES.items()
        if not course.get("directions") or "Call Center" in (course.get("directions") or [])
    }
    assert {it["slug"] for it in items} == visible_slugs
    assert len(items) >= 1
    for it in items:
        assert it["lessons_completed"] == 0
        assert it["completed"] is False
        assert it["lessons_count"] > 0


@pytest.mark.asyncio
async def test_full_course_flow_and_activity(client, user_id):
    slug = "abs_basics"
    course = COURSES[slug]

    detail = await client.get(f"/api/courses/{slug}?user_id={user_id}")
    assert detail.status_code == 200
    body = detail.json()
    # frontend payload не содержит правильных ответов
    for q in body["quiz"]:
        for opt in q["options"]:
            assert "correct" not in opt

    # 1. проходим все уроки
    for lesson in course["lessons"]:
        r = await client.post(
            "/api/courses/lessons/complete",
            json={
                "user_id": user_id,
                "course_slug": slug,
                "lesson_slug": lesson["slug"],
            },
        )
        assert r.status_code == 200, r.text

    # 2. отправляем правильный квиз
    correct_answers = {
        q["id"]: next(o["id"] for o in q["options"] if o["correct"])
        for q in course["quiz"]
    }
    r = await client.post(
        "/api/courses/quiz/submit",
        json={"user_id": user_id, "course_slug": slug, "answers": correct_answers},
    )
    assert r.status_code == 200
    quiz_body = r.json()
    assert quiz_body["passed"] is True
    assert quiz_body["course_completed"] is True
    assert quiz_body["points_awarded"] == course_xp_reward(course)
    assert quiz_body["next_scenario_id"] == course["target_scenario_id"]

    # 3. в Progress появился course-модуль
    prog = await client.get(f"/api/progress/{user_id}")
    pbody = prog.json()
    assert pbody["breakdown"]["courses_done"] == 1
    course_modules = [m for m in pbody["modules"] if m["kind"] == "course"]
    assert any(m["module"] == f"course:{slug}" and m["completion_pct"] == 100.0 for m in course_modules)

    # 4. журнал активности содержит ключевые события
    activity = (await client.get(f"/api/activity/{user_id}?limit=20")).json()
    kinds = {a["kind"] for a in activity}
    assert "course_started" in kinds
    assert "lesson_completed" in kinds
    assert "course_completed" in kinds


@pytest.mark.asyncio
async def test_quiz_failed_does_not_complete_course(client, user_id):
    slug = "crm_service_standards"
    course = COURSES[slug]

    # ответим неправильно на все вопросы (берём первую опцию, проверим что она не correct)
    wrong_answers: dict[str, str] = {}
    for q in course["quiz"]:
        wrong_opt = next((o["id"] for o in q["options"] if not o["correct"]), None)
        assert wrong_opt is not None
        wrong_answers[q["id"]] = wrong_opt

    r = await client.post(
        "/api/courses/quiz/submit",
        json={"user_id": user_id, "course_slug": slug, "answers": wrong_answers},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["passed"] is False
    assert body["course_completed"] is False
    assert body["points_awarded"] == 0


@pytest.mark.asyncio
async def test_lesson_completion_is_idempotent(client, user_id):
    slug = "abs_basics"
    first_lesson = COURSES[slug]["lessons"][0]["slug"]
    r1 = await client.post(
        "/api/courses/lessons/complete",
        json={"user_id": user_id, "course_slug": slug, "lesson_slug": first_lesson},
    )
    assert r1.json()["points_awarded"] == 10
    r2 = await client.post(
        "/api/courses/lessons/complete",
        json={"user_id": user_id, "course_slug": slug, "lesson_slug": first_lesson},
    )
    assert r2.json()["points_awarded"] == 0
    assert r2.json()["completed_count"] == 1
