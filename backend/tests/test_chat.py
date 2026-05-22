import pytest


@pytest.mark.asyncio
async def test_chat_mock_answer(client, user_id):
    res = await client.post(
        "/api/chat",
        json={"user_id": user_id, "message": "Какой дресс-код по пятницам?"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["answer"]
    assert isinstance(body["sources"], list)
    # для этого вопроса должен найтись хотя бы один релевантный фрагмент
    assert len(body["sources"]) >= 1
    assert any("дресс" in s["title"].lower() or "пятниц" in s["snippet"].lower() for s in body["sources"])


@pytest.mark.asyncio
async def test_chat_history(client, user_id):
    await client.post("/api/chat", json={"user_id": user_id, "message": "Тестовый вопрос"})
    res = await client.get(f"/api/chat/history/{user_id}")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2  # user + assistant
    roles = {item["role"] for item in items}
    assert roles == {"user", "assistant"}
