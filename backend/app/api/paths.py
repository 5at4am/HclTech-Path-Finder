from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..schemas import MentorResponse

from ..database import get_db
from ..schemas import (
    AdaptResponse,
    PathGenerateRequest,
    PathGenerateResponse,
    PathOut,
    SimulateRequest,
    SimulateResponse,
)
from ..services.path_generator import generate
from ..services.simulate_service import simulate
from ..models import LearningPath, LearningStep, Resource
from ..services.profile_service import check_learner_access
from .auth import get_current_user_optional
from ..models import User

router = APIRouter(prefix="/api/paths", tags=["paths"])


@router.post("/generate", response_model=PathGenerateResponse)
def generate_path(req: PathGenerateRequest, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    try:
        check_learner_access(db, req.learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    r = generate(db, req.learner_id)
    if not r:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return r


@router.get("/{path_id}", response_model=PathOut)
def get_path(path_id: str, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    path = db.get(LearningPath, path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Path not found.")
    try:
        check_learner_access(db, path.learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    steps = (
        db.query(LearningStep)
        .filter(LearningStep.path_id == path_id)
        .order_by(LearningStep.order)
        .all()
    )
    by_id = {r.id: r for r in db.query(Resource).all()}
    from ..schemas import LearningStepOut, ResourceOut
    from ..services.path_generator import build_unlocks
    from ..services.skill_gap_service import compute_gaps
    from ..models import Learner
    learner = db.get(Learner, path.learner_id)
    _, coverage = compute_gaps(learner) if learner else ([], 0)

    unlocks_map = build_unlocks([s.resource_id for s in steps], list(by_id.values()))

    step_outs = []
    for s in steps:
        r = by_id.get(s.resource_id)
        if r is None:
            # resource vanished from the catalog; skip rather than 500
            continue
        step_outs.append(
            LearningStepOut(
                id=s.id, resource_id=s.resource_id, order=s.order, phase=s.phase,
                status=s.status, completion_percentage=s.completion_percentage,
                estimated_hours=s.estimated_hours, milestone=bool(s.milestone),
                recommendation_score=float(s.recommendation_score), reason=s.reason,
                prerequisites=s.prerequisites or [], skills_gained=s.skills_gained or [],
                resource=ResourceOut(
                    id=r.id, title=r.title, type=r.type, domain=r.domain,
                    difficulty=r.difficulty, duration_hours=r.duration_hours, format=r.format,
                    description=r.description, skills_gained=r.skills_gained or [],
                    prerequisites=r.prerequisites or [], phase=r.phase, optional=bool(r.optional),
                    rating=float(r.rating or 0.0)),
                unlocks=unlocks_map.get(s.resource_id, []),
            )
        )
    return PathOut(
        path_id=path.id, learner_id=path.learner_id, goal=path.goal,
        target_role=path.target_role, timeline_months=path.timeline_months,
        study_time_per_week=path.study_time_per_week,
        prerequisite_coverage_pct=coverage, steps=step_outs,
    )


@router.post("/{path_id}/adapt", response_model=AdaptResponse)
def adapt(path_id: str, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    path = db.get(LearningPath, path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Path not found.")
    try:
        check_learner_access(db, path.learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    # Snapshot previous path for diff + progress preservation
    prev_steps = (
        db.query(LearningStep)
        .filter(LearningStep.path_id == path_id)
        .order_by(LearningStep.order)
        .all()
    )
    prev_by_resource: dict[str, LearningStep] = {s.resource_id: s for s in prev_steps}
    prev_ids = {s.resource_id for s in prev_steps}
    prev_titles = {s.resource_id: db.get(Resource, s.resource_id).title if db.get(Resource, s.resource_id) else s.resource_id for s in prev_steps}
    prev_timeline = path.timeline_months

    r = generate(db, path.learner_id)
    if not r:
        raise HTTPException(status_code=404, detail="Learner not found.")

    # Preserve partial progress (50% etc) for kept resources
    if prev_by_resource:
        new_steps = db.query(LearningStep).filter(LearningStep.path_id == r.path_id).all()
        changed = False
        for ns in new_steps:
            old = prev_by_resource.get(ns.resource_id)
            if old and old.completion_percentage not in (0, 100):
                ns.completion_percentage = old.completion_percentage
                # if old was 100-completed we already mark completed via completed_courses
                changed = True
        if changed:
            db.commit()
            # re-fetch to reflect kept pct in response (optional: patch r directly)
            for out in r.steps:
                old = prev_by_resource.get(out.resource_id)
                if old and old.completion_percentage not in (0, 100):
                    out.completion_percentage = old.completion_percentage

    new_ids = {s.resource_id for s in r.steps}
    added_ids = list(new_ids - prev_ids)
    removed_ids = list(prev_ids - new_ids)
    kept = len(new_ids & prev_ids)

    by_id = {res.id: res for res in db.query(Resource).all()}
    added_titles = [by_id[i].title if i in by_id else i for i in added_ids][:6]
    removed_titles = [prev_titles.get(i, i) for i in removed_ids][:6]

    # Build human summary
    summary: list[str] = []
    #反馈信号
    from ..models import Feedback
    recent = (
        db.query(Feedback)
        .filter(Feedback.learner_id == path.learner_id)
        .order_by(Feedback.created_at.desc())
        .limit(5)
        .all()
    )
    if recent:
        reasons = [f.reason for f in recent if f.reason]
        if reasons:
            summary.append(f"Applied {len(reasons)} recent feedback signal(s): {', '.join(reasons[:3])}.")
    if added_ids:
        summary.append(f"Added {len(added_ids)} step(s) to better fit your gaps.")
    if removed_ids:
        summary.append(f"Removed {len(removed_ids)} step(s) already known or lower priority.")
    if r.timeline_months != prev_timeline:
        delta = r.timeline_months - prev_timeline
        summary.append(f"Timeline {'+'+str(delta) if delta>0 else str(delta)} mo ({prev_timeline}->{r.timeline_months} mo) at {r.study_time_per_week}h/w.")
    if not summary:
        summary.append("Re-ranked by your latest progress and evidence; core prerequisites preserved.")
    # preserve note
    if kept:
        summary.append(f"Kept {kept} step(s) + your progress preserved.")

    return AdaptResponse(
        path_id=r.path_id,
        learner_id=r.learner_id,
        goal=r.goal,
        target_role=r.target_role,
        timeline_months=r.timeline_months,
        study_time_per_week=r.study_time_per_week,
        prerequisite_coverage_pct=r.prerequisite_coverage_pct,
        steps=r.steps,
        previous_path_id=path_id,
        added_resource_ids=added_ids,
        removed_resource_ids=removed_ids,
        added_titles=added_titles,
        removed_titles=removed_titles,
        kept_count=kept,
        changes_summary=summary,
    )


@router.post("/simulate", response_model=SimulateResponse)
def simulate_path(req: SimulateRequest, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    try:
        check_learner_access(db, req.learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    r = simulate(db, req.learner_id, req.changes)
    if not r:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return r


@router.get("/{path_id}/steps/{step_id}/explain", response_model=MentorResponse)
async def explain_step(path_id: str, step_id: str, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    path = db.get(LearningPath, path_id) if path_id else None
    if path:
        try:
            check_learner_access(db, path.learner_id, current_user)
        except PermissionError as e:
            raise HTTPException(status_code=403, detail=str(e))
    from ..services.explanation_service import explain_step as _explain
    r = await _explain(db, path_id, step_id)
    if not r:
        raise HTTPException(status_code=404, detail="Step not found.")
    return r
