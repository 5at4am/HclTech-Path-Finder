from __future__ import annotations

from types import SimpleNamespace
from sqlalchemy.orm import Session

from ..models import Learner, LearningPath, Resource
from ..schemas import SimulateResponse
from ..ml.ml_adapter import get_model
from .path_generator import (
    _build_profile_text,
    _select_for_goal,
    _order_for_path,
    _is_completed,
    _reason,
)
from .skill_gap_service import compute_gaps


def _estimate_months(learner_like, resources, model, weekly) -> tuple[int, int]:
    profile_text = _build_profile_text(learner_like)
    model_scores = model.score(profile_text)
    ordered = _order_for_path(_select_for_goal(resources, model_scores), model_scores)
    total = sum(r.duration_hours for r in ordered)
    weeks = total / max(1, weekly)
    return max(1, round(weeks / 4.3)), total


def _make_like(learner: Learner, changes: dict) -> SimpleNamespace:
    cur = dict(learner.current_skills or {})
    comp = list(learner.completed_courses or [])
    study = changes.get("study_time_per_week", learner.study_time_per_week)
    exp = changes.get("experience_level", learner.experience_level)
    pace = changes.get("preferred_pace", learner.preferred_pace)
    diff = changes.get("difficulty_preference", learner.difficulty_preference)
    interests = list(learner.interests or [])
    if "add_interest" in changes:
        interests.append(changes["add_interest"])
    return SimpleNamespace(
        target_role=learner.target_role,
        goal=learner.goal,
        interests=interests,
        objectives=list(learner.objectives or []),
        completed_courses=comp,
        current_skills=cur,
        study_time_per_week=study,
        experience_level=exp,
        preferred_pace=pace,
        difficulty_preference=diff,
    )


def simulate(db: Session, learner_id: str, changes: dict) -> SimulateResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    resources = db.query(Resource).all()
    model = get_model(resources)

    cur_months, cur_hours = _estimate_months(learner, resources, model, learner.study_time_per_week)
    sim_like = _make_like(learner, changes)
    sim_weekly = sim_like.study_time_per_week
    sim_months, sim_hours = _estimate_months(sim_like, resources, model, sim_weekly)

    profile_text = _build_profile_text(sim_like)
    model_scores = model.score(profile_text)
    ordered = _order_for_path(_select_for_goal(resources, model_scores), model_scores)

    completed_set = set()
    steps_out = []
    order_idx = 0
    current_assigned = False
    for r in ordered:
        is_comp = _is_completed(r, sim_like)
        prereqs = r.prerequisites or []
        prereqs_satisfied = all(p in completed_set for p in prereqs)
        if is_comp:
            status = "completed"
        elif not prereqs_satisfied:
            status = "locked"
        elif not current_assigned:
            status = "current"
            current_assigned = True
        else:
            status = "optional" if r.optional else "recommended"
        from ..schemas import LearningStepOut, ResourceOut
        steps_out.append(LearningStepOut(
            id=f"sim_{r.id}", resource_id=r.id, order=order_idx, phase=r.phase,
            status=status, completion_percentage=100 if is_comp else 0,
            estimated_hours=r.duration_hours, milestone=False,
            recommendation_score=round(model_scores.get(r.id, 0.0), 3),
            reason=_reason(r, sim_like, model_scores),
            prerequisites=list(prereqs), skills_gained=list(r.skills_gained or []),
            resource=ResourceOut(
                id=r.id, title=r.title, type=r.type, domain=r.domain,
                difficulty=r.difficulty, duration_hours=r.duration_hours, format=r.format,
                description=r.description, skills_gained=r.skills_gained or [],
                prerequisites=r.prerequisites or [], phase=r.phase, optional=bool(r.optional),
                rating=float(r.rating or 0.0)),
            unlocks=[],
        ))
        if is_comp:
            completed_set.add(r.id)
        order_idx += 1

    summary = []
    if "study_time_per_week" in changes:
        summary.append(f"Weekly study time set to {changes['study_time_per_week']} hrs "
                       f"(was {learner.study_time_per_week}).")
    if "experience_level" in changes:
        summary.append(f"Experience assumed as {changes['experience_level']}.")
    if "add_interest" in changes:
        summary.append(f"Added interest in {changes['add_interest']}; electives may shift.")
    summary.append("Core prerequisites preserved; timeline extended to fit new pace.")

    return SimulateResponse(
        current={
            "timeline_months": cur_months,
            "study_time_per_week": learner.study_time_per_week,
            "estimated_hours": cur_hours,
        },
        simulated={
            "timeline_months": sim_months,
            "study_time_per_week": sim_weekly,
            "estimated_hours": sim_hours,
        },
        changes_summary=summary,
        steps=steps_out,
    )
