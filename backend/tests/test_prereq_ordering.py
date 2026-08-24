from __future__ import annotations

from conftest import create_learner, generate_path


def test_path_generated_with_ordered_steps(client):
    learner = create_learner(client, name="Path Ordering")
    path = generate_path(client, learner["learner_id"])

    steps = path["steps"]
    assert len(steps) >= 3
    orders = [s["order"] for s in steps]
    assert orders == sorted(orders)
    assert all(s["resource"]["title"] for s in steps)


def test_no_step_appears_before_unsatisfied_prerequisite(client):
    learner = create_learner(
        client,
        name="Prereq Guard",
        current_skills={},
        completed_courses=[],
    )
    path = generate_path(client, learner["learner_id"])
    steps = path["steps"]

    position = {s["resource_id"]: i for i, s in enumerate(steps)}
    violations = []
    for step in steps:
        for pre in step.get("prerequisites", []):
            if pre in position and position[pre] >= position[step["resource_id"]]:
                violations.append((step["resource_id"], "blocked by", pre))
    assert not violations, f"prerequisite order violated: {violations[:5]}"


def test_completed_resources_excluded_and_first_incomplete_is_current(client):
    learner = create_learner(client, name="Current Status")
    path = generate_path(client, learner["learner_id"])
    steps = path["steps"]

    statuses = [s["status"] for s in steps]

    # a fresh learner has nothing completed yet
    assert "completed" not in statuses

    current_positions = [i for i, s in enumerate(steps) if s["status"] == "current"]
    if current_positions:
        first_incomplete = next(i for i, s in enumerate(steps) if s["status"] != "completed")
        assert current_positions == [first_incomplete]

    # locked steps may only appear after the current one
    if current_positions:
        cur = current_positions[0]
        for i, s in enumerate(steps):
            if s["status"] == "locked":
                assert i > cur
