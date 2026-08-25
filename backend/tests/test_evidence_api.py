"""API-level check that the Evidence Engine surfaces through the HTTP layer."""
from __future__ import annotations


def _profile(**over):
    p = {
        "name": "Eve",
        "goal": "Become a frontend developer and learn React, HTML and CSS",
        "target_role": "Frontend Developer",
        "timeline_months": 6,
        "interests": ["Web Development"],
        "experience_level": "beginner",
        "current_skills": {"HTML": 20},
        "completed_courses": [],
        "study_time_per_week": 8,
        "difficulty_preference": "easy",
    }
    p.update(over)
    return p


def test_recommendations_carry_evidence(client):
    r = client.post("/api/profile", json=_profile())
    assert r.status_code == 200, r.text
    lid = r.json()["learner_id"]
    recs = client.get(f"/api/recommendations/{lid}").json()["recommendations"]
    assert recs, "expected recommendations"
    assert "evidence_score" in recs[0]
    grounded = [rec for rec in recs if rec.get("evidence") and rec["evidence"].get("course_signatures")]
    assert grounded, "at least one recommendation should carry real review evidence"


def test_explain_endpoint_returns_evidence(client):
    r = client.post("/api/profile", json=_profile())
    lid = r.json()["learner_id"]
    path = client.post("/api/paths/generate", json={"learner_id": lid}).json()
    step = path["steps"][0]
    ex = client.get(f"/api/paths/{path['path_id']}/steps/{step['id']}/explain")
    assert ex.status_code == 200, ex.text
    body = ex.json()
    assert body.get("evidence") is not None
    # The message must trace to evidence, not invent a foreign course.
    assert "Deep Learning with TensorFlow" not in body["message"]
