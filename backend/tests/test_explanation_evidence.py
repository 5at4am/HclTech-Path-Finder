"""Tests for evidence-grounded explanation (app.services.explanation_service)."""
from __future__ import annotations

import pytest

from app.ml import evidence_engine as ee
from app.services import explanation_service as es


def test_sanitize_redacts_unknown_course(monkeypatch):
    fake = {
        "course_names": [
            "HTML and CSS for Beginners",
            "Deep Learning with TensorFlow",
            "React Native Mobile Development",
        ]
    }
    monkeypatch.setattr(ee, "get_engine", lambda: fake)
    out = es._sanitize(
        "You should also take Deep Learning with TensorFlow, it is great.",
        allowed={"HTML and CSS for Beginners"},
    )
    assert "Deep Learning with TensorFlow" not in out
    assert "[another course]" in out


def test_sanitize_keeps_allowed_course(monkeypatch):
    fake = {"course_names": ["HTML and CSS for Beginners"]}
    monkeypatch.setattr(ee, "get_engine", lambda: fake)
    out = es._sanitize(
        "HTML and CSS for Beginners is a great fit.",
        allowed={"HTML and CSS for Beginners"},
    )
    assert "HTML and CSS for Beginners" in out


def test_explain_step_returns_grounded_evidence(monkeypatch):
    if not ee.engine_ready():
        pytest.skip("evidence engine not built")
    # Build a minimal fake DB session.
    from types import SimpleNamespace
    from app.schemas import Evidence

    ev = Evidence(
        course_signatures=["By the end I could build a webpage with HTML and CSS."],
        similarity=0.4,
        peer_courses=["Responsive Web Design"],
        source="evidence_engine",
    )
    monkeypatch.setattr(ee, "explain", lambda *a, **k: ev)
    monkeypatch.setattr(es, "compute_gaps", lambda *a, **k: ([], 0))
    monkeypatch.setattr(es, "_build_profile_text", lambda *a, **k: "")

    step = SimpleNamespace(
        id="s1", path_id="p1", resource_id="r1",
        skills_gained=["html"], prerequisites=[],
    )
    path = SimpleNamespace(learner_id="l1")
    resource = SimpleNamespace(id="r1", title="HTML and CSS for Beginners", domain="Frontend")
    learner = SimpleNamespace(
        completed_courses=[], interests=[],
    )

    class FakeDB:
        def get(self, model, pk):
            return {"LearningStep": step, "LearningPath": path,
                    "Resource": resource, "Learner": learner}[model.__name__]

        def query(self, model):
            class Q:
                def filter(self, *a):
                    return self

                def all(self):
                    return []
            return Q()

    import asyncio

    resp = asyncio.run(es.explain_step(FakeDB(), "p1", "s1"))
    assert resp is not None
    assert resp.evidence is not None
    assert resp.evidence.course_signatures
    # The message must trace to the evidence, not invent a different course.
    assert "Deep Learning" not in resp.message
