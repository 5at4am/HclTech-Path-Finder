"""Shared fixtures for the PadhAI backend test suite.

The DATABASE_URL environment variable MUST be set before any `app.*` import so
that config/database bind the ORM to a disposable SQLite file instead of the
real padhai.db. Groq is never called: tests either exercise endpoints that do
not need it or monkeypatch the service functions to deterministic stubs.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

TESTS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = TESTS_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_DB = TESTS_DIR / "_test_padhai.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session")
def client():
    TEST_DB.unlink(missing_ok=True)
    from app.main import app
    from app.database import engine

    with TestClient(app) as c:
        yield c
    engine.dispose()
    try:
        TEST_DB.unlink(missing_ok=True)
    except PermissionError:
        pass  # Windows can briefly keep the handle open; temp file is disposable


def make_profile(**overrides) -> dict:
    payload = {
        "name": "Test Learner",
        "goal": "I want to become an AI/ML engineer in 8 months and build a portfolio",
        "target_role": "AI/ML Engineer",
        "timeline_months": 8,
        "interests": ["Machine Learning", "Python"],
        "experience_level": "intermediate",
        "current_skills": {"Python": 70, "SQL": 55},
        "completed_courses": [],
        "objectives": ["get a job", "build projects"],
        "study_time_per_week": 6,
        "preferred_format": "video",
        "preferred_pace": "moderate",
        "difficulty_preference": "medium",
        "learning_history": [],
    }
    payload.update(overrides)
    return payload


def create_learner(client: TestClient, **overrides) -> dict:
    r = client.post("/api/profile", json=make_profile(**overrides))
    assert r.status_code == 200, r.text
    return r.json()


def generate_path(client: TestClient, learner_id: str) -> dict:
    r = client.post("/api/paths/generate", json={"learner_id": learner_id})
    assert r.status_code == 200, r.text
    return r.json()
