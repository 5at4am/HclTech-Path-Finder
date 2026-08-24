from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Learner, LearningPath, LearningStep, Progress, Resource
from ..schemas import ProgressResponse
from .skill_gap_service import required_for


def _learner_path(db: Session, learner_id: str):
    return (
        db.query(LearningPath)
        .filter(LearningPath.learner_id == learner_id)
        .order_by(LearningPath.created_at.desc())
        .first()
    )


def _recompute_steps(db: Session, path_id: str, completed_ids: set) -> int:
    steps = db.query(LearningStep).filter(LearningStep.path_id == path_id).order_by(LearningStep.order).all()
    current_assigned = False
    completed_count = 0
    for s in steps:
        prereqs = s.prerequisites or []
        prereqs_satisfied = all(p in completed_ids for p in prereqs)
        if s.resource_id in completed_ids:
            s.status = "completed"
            completed_count += 1
        elif not prereqs_satisfied:
            s.status = "locked"
        elif not current_assigned:
            s.status = "current"
            current_assigned = True
        else:
            s.status = "optional" if s.phase and getattr(s, "optional", False) else "recommended"
    db.commit()
    return completed_count, len(steps)


def update_progress(
    db: Session,
    learner_id: str,
    resource_id: str,
    completion_percentage: int = 0,
    status: str | None = None,
    time_spent_hours: float = 0.0,
) -> ProgressResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    resource = db.get(Resource, resource_id)
    if not resource:
        return None

    is_complete = (status == "completed") or completion_percentage >= 100

    # upsert progress
    prog = (
        db.query(Progress)
        .filter(Progress.learner_id == learner_id, Progress.resource_id == resource_id)
        .first()
    )
    if not prog:
        prog = Progress(learner_id=learner_id, resource_id=resource_id)
        db.add(prog)
    prog.completion_percentage = completion_percentage
    prog.status = status or ("completed" if is_complete else "in-progress")
    prog.time_spent_hours = (prog.time_spent_hours or 0.0) + time_spent_hours

    completed_courses = set(learner.completed_courses or [])
    if is_complete:
        completed_courses.add(resource_id)
    learner.completed_courses = list(completed_courses)
    learner.learning_history = list(set(learner.learning_history or []) | {resource_id})

    # skill growth
    cur = dict(learner.current_skills or {})
    for sk in resource.skills_gained or []:
        gain = int(85 * completion_percentage / 100)
        cur[sk] = max(int(cur.get(sk, 0)), gain)
    learner.current_skills = cur

    path = _learner_path(db, learner_id)
    path_complete_pct = 0
    next_action = None
    if path:
        completed_ids = set(completed_courses)
        done, total = _recompute_steps(db, path.id, completed_ids)
        path_complete_pct = round(100 * done / max(1, total))
        # update this step's completion
        step = (
            db.query(LearningStep)
            .filter(LearningStep.path_id == path.id, LearningStep.resource_id == resource_id)
            .first()
        )
        if step:
            step.completion_percentage = completion_percentage
            if is_complete:
                step.status = "completed"
        # find current next action
        nxt = (
            db.query(LearningStep)
            .filter(LearningStep.path_id == path.id)
            .order_by(LearningStep.order)
            .all()
        )
        for s in nxt:
            if s.status == "current":
                r = db.get(Resource, s.resource_id)
                next_action = f"Continue: {r.title}" if r else None
                break
        if next_action is None and done >= total:
            next_action = "Path complete — review or explore electives"

    db.commit()

    return ProgressResponse(
        learner_id=learner_id,
        resource_id=resource_id,
        completion_percentage=completion_percentage,
        status=prog.status,
        next_action=next_action,
        path_complete_pct=path_complete_pct,
    )
