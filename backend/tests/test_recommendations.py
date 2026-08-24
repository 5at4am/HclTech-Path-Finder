from __future__ import annotations

from conftest import create_learner


def _recs(client, learner_id: str) -> list[dict]:
    r = client.get(f"/api/recommendations/{learner_id}")
    assert r.status_code == 200, r.text
    return r.json()["recommendations"]


def test_recommendations_returned_with_scores_and_reasons(client):
    learner = create_learner(client, name="Rec Basic")
    recs = _recs(client, learner["learner_id"])
    assert len(recs) > 0
    for rec in recs:
        assert 0.0 <= rec["match_score"] <= 1.5
        assert rec["reason"], "every recommendation must carry a human-readable reason"
        assert rec["resource"]["id"]
        # heuristic scores must never be presented as AI confidence
        assert "confidence" not in rec["reason"].lower()


def test_completed_resources_are_not_recommended(client):
    learner_a = create_learner(client, name="Rec Completed A")
    first_ids = [rec["resource"]["id"] for rec in _recs(client, learner_a["learner_id"])[:4]]
    assert first_ids

    learner_b = create_learner(
        client,
        name="Rec Completed B",
        completed_courses=first_ids,
        current_skills={"Python": 70},
    )
    ids_b = {rec["resource"]["id"] for rec in _recs(client, learner_b["learner_id"])}
    overlap = set(first_ids) & ids_b
    assert not overlap, f"completed resources resurfaced: {overlap}"


def test_unknown_learner_returns_404(client):
    r = client.get("/api/recommendations/ghost")
    assert r.status_code == 404
