from __future__ import annotations

from conftest import create_learner


def test_create_and_get_profile(client):
    created = create_learner(
        client,
        name="Profile Flow",
        current_skills={"Python": 65},
        interests=["Machine Learning"],
    )
    lid = created["learner_id"]
    assert lid

    r = client.get(f"/api/profile/{lid}")
    assert r.status_code == 200
    got = r.json()
    assert got["goal"].startswith("I want to become an AI/ML engineer")
    assert got["timeline_months"] == 8
    assert got["current_skills"]["Python"] == 65
    assert got["interests"] == ["Machine Learning"]


def test_get_unknown_profile_returns_404(client):
    r = client.get("/api/profile/no_such_learner")
    assert r.status_code == 404


def test_profile_defaults_applied(client):
    created = create_learner(client, name="Defaults")
    r = client.get(f"/api/profile/{created['learner_id']}")
    body = r.json()
    assert body["experience_level"] in {"beginner", "intermediate", "advanced"}
    assert body["study_time_per_week"] > 0
