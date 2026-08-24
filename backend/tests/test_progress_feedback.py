from __future__ import annotations

from conftest import create_learner, generate_path


def _dashboard(client, learner_id: str) -> dict:
    r = client.get(f"/api/dashboard/{learner_id}")
    assert r.status_code == 200, r.text
    return r.json()


def test_completing_a_step_updates_progress_and_dashboard(client):
    learner = create_learner(client, name="Progress Flow")
    path = generate_path(client, learner["learner_id"])
    current = next(s for s in path["steps"] if s["status"] == "current")

    before = _dashboard(client, learner["learner_id"])
    assert before["path_complete_pct"] == 0

    r = client.post(
        "/api/progress",
        json={
            "learner_id": learner["learner_id"],
            "resource_id": current["resource_id"],
            "completion_percentage": 100,
            "status": "completed",
            "time_spent_hours": 2.5,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "completed"
    assert body["path_complete_pct"] > 0

    after = _dashboard(client, learner["learner_id"])
    assert after["path_complete_pct"] >= body["path_complete_pct"]
    assert after["continue_resource"] is None or (
        after["continue_resource"]["id"] != current["resource_id"]
    )


def test_feedback_already_know_raises_skills_and_skips_resource(client):
    learner = create_learner(client, name="Feedback Know")
    lid = learner["learner_id"]

    recs = client.get(f"/api/recommendations/{lid}").json()["recommendations"]
    target = next(rec for rec in recs if rec["resource"]["skills_gained"])
    rid = target["resource"]["id"]

    r = client.post(
        "/api/feedback",
        json={"learner_id": lid, "resource_id": rid, "helpful": False, "reason": "already_know"},
    )
    assert r.status_code == 200
    adaptation = r.json()["adaptation"].lower()
    assert "known" in adaptation or "forward" in adaptation

    profile = client.get(f"/api/profile/{lid}").json()
    assert rid in profile["completed_courses"]
    gained = set(target["resource"]["skills_gained"])
    assert all(profile["current_skills"].get(sk, 0) >= 90 for sk in gained)

    # the known resource must no longer be recommended
    ids_now = {rec["resource"]["id"] for rec in client.get(f"/api/recommendations/{lid}").json()["recommendations"]}
    assert rid not in ids_now


def test_feedback_too_difficult_downgrades_difficulty_preference(client):
    learner = create_learner(client, name="Feedback Difficult", difficulty_preference="medium")
    lid = learner["learner_id"]
    recs = client.get(f"/api/recommendations/{lid}").json()["recommendations"]
    rid = recs[0]["resource"]["id"]

    r = client.post(
        "/api/feedback",
        json={"learner_id": lid, "resource_id": rid, "helpful": False, "reason": "too_difficult"},
    )
    assert r.status_code == 200

    profile = client.get(f"/api/profile/{lid}").json()
    assert profile["difficulty_preference"] == "easy"


def test_feedback_requires_resource(client):
    learner = create_learner(client, name="Feedback Invalid")
    r = client.post("/api/feedback", json={"learner_id": learner["learner_id"], "resource_id": ""})
    assert r.status_code == 422
