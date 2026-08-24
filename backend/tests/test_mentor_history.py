from __future__ import annotations

from conftest import create_learner


def test_mentor_history_persists_and_replays(client, monkeypatch):
    import app.services.mentor_service as ms

    # force the deterministic rule-based mentor (no network/Groq in tests)
    monkeypatch.setattr(ms, "groq_available", lambda: False)

    learner = create_learner(client, name="Mentor History")
    lid = learner["learner_id"]

    r = client.post(
        "/api/mentor/chat",
        json={"learner_id": lid, "message": "What should I learn today?"},
    )
    assert r.status_code == 200
    assert r.json()["message"]

    h = client.get(f"/api/mentor/history/{lid}")
    assert h.status_code == 200
    msgs = h.json()
    assert [m["role"] for m in msgs] == ["user", "assistant"]
    assert msgs[0]["message"] == "What should I learn today?"
    assert msgs[1]["message"]


def test_mentor_history_empty_for_new_learner(client):
    learner = create_learner(client, name="Mentor No History")
    h = client.get(f"/api/mentor/history/{learner['learner_id']}")
    assert h.status_code == 200
    assert h.json() == []
