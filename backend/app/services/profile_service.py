from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from ..models import Learner
from ..schemas import ProfileCreate, ProfileResponse
from .skill_gap_service import normalize_current_skills


def _to_response(learner: Learner) -> ProfileResponse:
    return ProfileResponse(
        learner_id=learner.id,
        name=learner.name,
        goal=learner.goal,
        target_role=learner.target_role,
        timeline_months=learner.timeline_months,
        interests=learner.interests or [],
        experience_level=learner.experience_level,
        current_skills=learner.current_skills or {},
        completed_courses=learner.completed_courses or [],
        objectives=learner.objectives or [],
        study_time_per_week=learner.study_time_per_week,
        preferred_format=learner.preferred_format,
        preferred_pace=learner.preferred_pace,
        difficulty_preference=learner.difficulty_preference,
        learning_history=learner.learning_history or [],
        created_at=learner.created_at,
    )


def create_profile(db: Session, data: ProfileCreate) -> ProfileResponse:
    lid = data.learner_id or f"learner_{uuid.uuid4().hex[:8]}"
    payload = data.model_dump(exclude={"learner_id"})
    payload["current_skills"] = normalize_current_skills(payload.get("current_skills"))
    existing = db.get(Learner, lid)
    if existing:
        for k, v in payload.items():
            setattr(existing, k, v)
        learner = existing
    else:
        learner = Learner(id=lid, **payload)
        db.add(learner)
    db.commit()
    db.refresh(learner)
    return _to_response(learner)


def get_profile(db: Session, learner_id: str) -> ProfileResponse | None:
    learner = db.get(Learner, learner_id)
    return _to_response(learner) if learner else None
