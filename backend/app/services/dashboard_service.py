from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..models import Feedback, Learner, LearningPath, LearningStep, Progress, Resource, Skill
from ..schemas import DashboardResponse
from .skill_gap_service import compute_gaps, required_for


def _streak(db: Session, learner_id: str) -> int:
    rows = (
        db.query(Progress.updated_at)
        .filter(Progress.learner_id == learner_id)
        .order_by(Progress.updated_at)
        .all()
    )
    days = set()
    for (ts,) in rows:
        if ts:
            days.add(ts.date().isoformat())
    # simple streak: count distinct active days (proxy for consecutive engagement)
    return len(days)


def build_dashboard(db: Session, learner_id: str) -> DashboardResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    path = (
        db.query(LearningPath)
        .filter(LearningPath.learner_id == learner_id)
        .order_by(LearningPath.created_at.desc())
        .first()
    )
    steps = []
    if path:
        steps = (
            db.query(LearningStep)
            .filter(LearningStep.path_id == path.id)
            .order_by(LearningStep.order)
            .all()
        )
    gaps, coverage = compute_gaps(learner)

    total = max(1, len(steps))
    done = sum(1 for s in steps if s.status == "completed")
    path_complete_pct = round(100 * done / total)

    required = required_for(learner.target_role, learner.goal)
    cur = learner.current_skills or {}
    covered = sum(1 for sk, req in required.items() if int(cur.get(sk, 0)) >= req * 0.6)
    skills_covered = f"{covered}/{len(required)}"

    # continue resource = current step
    continue_resource = None
    continue_pct = 0
    continue_remaining = 0.0
    current_step = next((s for s in steps if s.status == "current"), None)
    if current_step:
        r = db.get(Resource, current_step.resource_id)
        if r:
            continue_resource = _resource_out(r)
            continue_pct = current_step.completion_percentage
            continue_remaining = round(r.duration_hours * (1 - continue_pct / 100), 1)

    # next actions
    next_actions = []
    if current_step:
        r = db.get(Resource, current_step.resource_id)
        if r:
            next_actions.append(f"Continue {r.title}")
    upcoming = [s for s in steps if s.status in ("recommended", "locked")][:3]
    for s in upcoming:
        r = db.get(Resource, s.resource_id)
        if r:
            next_actions.append(f"Up next: {r.title}")
    if not next_actions:
        next_actions = ["Your path is complete — explore electives or review."]

    skill_rows = []
    for sk, req in required.items():
        lvl = int(cur.get(sk, 0))
        skill_rows.append({
            "skill": sk, "level": lvl, "required": req,
            "gap": max(0, req - lvl),
            "domain": _domain_of(db, sk),
        })
    skill_rows.sort(key=lambda x: x["gap"], reverse=True)

    priority_gaps = [
        {"skill": g.skill, "gap": g.gap, "current_level": g.current_level}
        for g in gaps[:4]
    ]

    from datetime import timedelta
    week_ago = datetime.now() - timedelta(days=7)
    hours_this_week = round(sum(
        (p.time_spent_hours or 0.0) for p in
        db.query(Progress).filter(Progress.learner_id == learner_id).all()
        if p.updated_at and p.updated_at.replace(tzinfo=None) >= week_ago
    ), 1)

    recent_feedback = [
        {"resource_id": f.resource_id, "helpful": f.helpful, "reason": f.reason}
        for f in db.query(Feedback).filter(Feedback.learner_id == learner_id)
        .order_by(Feedback.created_at.desc()).limit(3).all()
    ]

    return DashboardResponse(
        learner_id=learner_id,
        name=learner.name,
        goal=learner.goal,
        target_role=learner.target_role,
        timeline_months=learner.timeline_months,
        study_time_per_week=learner.study_time_per_week,
        interests=learner.interests or [],
        path_id=path.id if path else None,
        path_complete_pct=path_complete_pct,
        skills_covered=skills_covered,
        streak_days=_streak(db, learner_id),
        hours_this_week=hours_this_week,
        continue_resource=continue_resource,
        continue_pct=continue_pct,
        continue_remaining_hours=continue_remaining,
        next_actions=next_actions[:5],
        skills=skill_rows,
        priority_gaps=priority_gaps,
        recent_feedback=recent_feedback,
    )


def _resource_out(r: Resource):
    from .recommendation_service import _resource_out as ro
    return ro(r)


def _domain_of(db: Session, skill: str) -> str:
    sk = db.get(Skill, skill)
    return sk.domain if sk else ""
