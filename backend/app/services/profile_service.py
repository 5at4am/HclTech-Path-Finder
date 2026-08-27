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


def create_profile(db: Session, data: ProfileCreate, user_id: str | None = None) -> ProfileResponse:
    lid = data.learner_id or f"learner_{uuid.uuid4().hex[:8]}"
    payload = data.model_dump(exclude={"learner_id"})
    payload["current_skills"] = normalize_current_skills(payload.get("current_skills"))
    existing = db.get(Learner, lid)
    if existing:
        # ownership enforcement: if learner already owned by another user, reject
        if existing.user_id and user_id and existing.user_id != user_id:
            raise PermissionError("Learner belongs to another user.")
        if existing.user_id and not user_id:
            raise PermissionError("Authentication required for this learner.")
        # adopt orphan learner if creating with auth
        if not existing.user_id and user_id:
            existing.user_id = user_id
        for k, v in payload.items():
            setattr(existing, k, v)
        learner = existing
    else:
        if user_id:
            payload["user_id"] = user_id
        learner = Learner(id=lid, **payload)
        db.add(learner)
    db.commit()
    db.refresh(learner)
    return _to_response(learner)


def get_profile(db: Session, learner_id: str) -> ProfileResponse | None:
    learner = db.get(Learner, learner_id)
    return _to_response(learner) if learner else None


def check_learner_access(db: Session, learner_id: str, current_user) -> Learner | None:
    """Fetch learner and enforce ownership if it has a user_id."""
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    if learner.user_id:
        if not current_user:
            raise PermissionError("Authentication required.")
        if learner.user_id != current_user.id:
            raise PermissionError("Forbidden: learner belongs to another user.")
    return learner


def list_learners_for_user(db: Session, user_id: str) -> list[ProfileResponse]:
    learners = db.query(Learner).filter(Learner.user_id == user_id).order_by(Learner.created_at.desc()).all()
    return [_to_response(l) for l in learners]
