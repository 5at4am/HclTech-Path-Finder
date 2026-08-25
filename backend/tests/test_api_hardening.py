"""Adversarial API hardening tests: validation, 404 consistency, abuse caps.

Each test corresponds to a defect found while probing the live API
(see memory.md section 13) — keep them green to keep the fixes in.
"""

from __future__ import annotations

import httpx

from conftest import create_learner, generate_path


# ---------- 404 consistency ----------

def test_mentor_chat_unknown_learner_returns_404(client):
    r = client.post("/api/mentor/chat", json={"learner_id": "ghost", "message": "hi"})
    assert r.status_code == 404


def test_feedback_unknown_learner_returns_404(client):
    r = client.post(
        "/api/feedback",
        json={"learner_id": "ghost", "resource_id": "x", "helpful": False, "reason": "too_difficult"},
    )
    assert r.status_code == 404


def test_progress_unknown_learner_returns_404(client):
    r = client.post(
        "/api/progress",
        json={"learner_id": "ghost", "resource_id": "x", "completion_percentage": 50},
    )
    assert r.status_code == 404
    assert client.get("/api/progress/ghost").status_code == 404


# ---------- input validation: reject abuse ----------

def test_progress_rejects_out_of_range_values(client):
    learner = create_learner(client, name="Val Progress")
    base = {"learner_id": learner["learner_id"], "resource_id": "python_for_absolute_beginners"}
    assert client.post("/api/progress", json={**base, "completion_percentage": 150}).status_code == 422
    assert client.post("/api/progress", json={**base, "completion_percentage": -20}).status_code == 422
    assert client.post("/api/progress", json={**base, "completion_percentage": 10, "time_spent_hours": -1}).status_code == 422


def test_profile_rejects_hostile_learner_ids(client):
    for bad in ("../../etc/passwd", "a/b", "a b", "x" * 65):
        r = client.post("/api/profile", json={"learner_id": bad, "name": "Z", "goal": "learn"})
        assert r.status_code == 422, f"learner_id {bad!r} should be rejected"


def test_profile_rejects_oversized_goal(client):
    r = client.post("/api/profile", json={"name": "Z", "goal": "x" * 20000})
    assert r.status_code == 422


def test_goal_analyze_rejects_whitespace_and_oversized(client):
    assert client.post("/api/goals/analyze", json={"goal": "   "}).status_code == 422
    assert client.post("/api/goals/analyze", json={"goal": "a" * 10000}).status_code == 422


def test_goal_analyze_accepts_unicode_goal(client, monkeypatch):
    import app.services.goal_service as gs

    async def fake_parse(goal: str):
        return {"goal": goal, "domain": "Machine Learning", "target_role": "AI/ML Engineer"}

    monkeypatch.setattr(gs, "parse_goal", fake_parse)
    r = client.post("/api/goals/analyze", json={"goal": "我想成为 AI 工程师 🚀 in 6 months"})
    assert r.status_code == 200
    assert r.json()["goal"].endswith("in 6 months")


# ---------- input validation: clamp honest mistakes ----------

def test_profile_clamps_out_of_range_numbers(client):
    created = create_learner(
        client,
        name="Clamp Me",
        goal="Learn ML",
        timeline_months=0,
        study_time_per_week=-5,
        current_skills={"Python": 250, "": 50},
        interests=["  ", "Machine Learning"],
    )
    profile = client.get(f"/api/profile/{created['learner_id']}").json()
    assert profile["timeline_months"] == 1
    assert profile["study_time_per_week"] == 1
    assert all(0 <= v <= 100 for v in profile["current_skills"].values())
    assert "" not in profile["current_skills"]
    assert profile["interests"] == ["Machine Learning"]


def test_simulate_clamps_study_time_and_ignores_garbage(client):
    learner = create_learner(client, name="Sim Hardening", study_time_per_week=6)
    generate_path(client, learner["learner_id"])

    r = client.post(
        "/api/paths/simulate",
        json={"learner_id": learner["learner_id"],
              "changes": {"study_time_per_week": -3, "hacker_field": "drop table learners"}},
    )
    assert r.status_code == 200
    sim = r.json()
    assert sim["simulated"]["study_time_per_week"] >= 1
    assert not any("hacker" in s for s in sim["changes_summary"])


# ---------- observability ----------

def test_health_reports_subsystems(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert body["resources"] > 0
    assert body["model_ready"] is True
    assert isinstance(body["groq_configured"], bool)
