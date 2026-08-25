"""Tests for the Evidence Engine (app.ml.evidence_engine)."""
from __future__ import annotations

import pytest

from app.ml import evidence_engine as ee
from app.schemas import Evidence


def test_engine_loads():
    eng = ee.get_engine()
    assert eng is not None
    assert len(eng["course_names"]) > 0
    assert eng["centroids"].shape[0] == len(eng["course_names"])


def test_explain_returns_grounded_evidence():
    if not ee.engine_ready():
        pytest.skip("evidence engine not built (run build_evidence)")
    course = "HTML and CSS for Beginners"
    goal = "I want to learn HTML and CSS to build responsive websites."
    ev = ee.explain(goal, course, k=4)
    assert isinstance(ev, Evidence)
    # Substantive, real review sentences (not empty / not junk).
    assert ev.course_signatures, "expected substantive signature sentences"
    assert all(len(s.split()) >= 3 for s in ev.course_signatures)
    assert ev.similarity > 0.0
    assert ev.peer_courses, "expected peer courses"


def test_explain_relevant_peers():
    if not ee.engine_ready():
        pytest.skip("evidence engine not built (run build_evidence)")
    goal = "Become a frontend developer working with JavaScript and React."
    ev = ee.explain(goal, "JavaScript Full Stack Development", k=4)
    joined = " ".join(ev.peer_courses).lower()
    assert any(w in joined for w in ["html", "css", "javascript", "react", "responsive"])


def test_explain_unknown_course_is_safe():
    if not ee.engine_ready():
        pytest.skip("evidence engine not built (run build_evidence)")
    ev = ee.explain("learn to code", "No Such Course 12345", k=3)
    assert isinstance(ev, Evidence)
    assert ev.similarity == 0.0
    assert ev.peer_courses == []
