from __future__ import annotations

from conftest import create_learner, generate_path


def _profile(client, learner_id: str) -> dict:
    return client.get(f"/api/profile/{learner_id}").json()


def _path_snapshot(client, path_id: str) -> list[dict]:
    return client.get(f"/api/paths/{path_id}").json()["steps"]


def test_simulation_changes_timeline_without_mutating_real_data(client):
    learner = create_learner(client, name="Sim Guard", study_time_per_week=6)
    lid = learner["learner_id"]
    path = generate_path(client, lid)
    path_id = path["path_id"]

    profile_before = _profile(client, lid)
    steps_before = _path_snapshot(client, path_id)

    r = client.post(
        "/api/paths/simulate",
        json={"learner_id": lid, "changes": {"study_time_per_week": 3}},
    )
    assert r.status_code == 200, r.text
    sim = r.json()

    # simulated plan reflects the reduced budget...
    assert sim["simulated"]["study_time_per_week"] == 3
    assert sim["current"]["study_time_per_week"] == 6
    assert sim["changes_summary"], "simulation should explain what changed"

    # ...while the real learner and real path are untouched
    assert _profile(client, lid) == profile_before
    assert _path_snapshot(client, path_id) == steps_before


def test_fewer_hours_never_shortens_the_estimated_plan(client):
    learner = create_learner(client, name="Sim Timeline", study_time_per_week=10)
    lid = learner["learner_id"]
    generate_path(client, lid)

    six = client.post("/api/paths/simulate", json={"learner_id": lid, "changes": {"study_time_per_week": 3}}).json()
    ten = client.post("/api/paths/simulate", json={"learner_id": lid, "changes": {"study_time_per_week": 10}}).json()

    months_low = six["simulated"].get("estimated_months") or six["simulated"].get("timeline_months")
    months_high = ten["simulated"].get("estimated_months") or ten["simulated"].get("timeline_months")
    assert months_low is not None and months_high is not None
    assert months_low >= months_high
