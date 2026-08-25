from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..schemas import MentorResponse

from ..database import get_db
from ..schemas import (
    PathGenerateRequest,
    PathGenerateResponse,
    PathOut,
    SimulateRequest,
    SimulateResponse,
)
from ..services.path_generator import generate
from ..services.simulate_service import simulate
from ..models import LearningPath, LearningStep, Resource

router = APIRouter(prefix="/api/paths", tags=["paths"])


@router.post("/generate", response_model=PathGenerateResponse)
def generate_path(req: PathGenerateRequest, db: Session = Depends(get_db)):
    r = generate(db, req.learner_id)
    if not r:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return r


@router.get("/{path_id}", response_model=PathOut)
def get_path(path_id: str, db: Session = Depends(get_db)):
    path = db.get(LearningPath, path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Path not found.")
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


@router.post("/{path_id}/adapt", response_model=PathGenerateResponse)
def adapt(path_id: str, db: Session = Depends(get_db)):
    path = db.get(LearningPath, path_id)
    if not path:
        raise HTTPException(status_code=404, detail="Path not found.")
    r = generate(db, path.learner_id)
    return r


@router.post("/simulate", response_model=SimulateResponse)
def simulate_path(req: SimulateRequest, db: Session = Depends(get_db)):
    r = simulate(db, req.learner_id, req.changes)
    if not r:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return r


@router.get("/{path_id}/steps/{step_id}/explain", response_model=MentorResponse)
async def explain_step(path_id: str, step_id: str, db: Session = Depends(get_db)):
    from ..services.explanation_service import explain_step as _explain
    r = await _explain(db, path_id, step_id)
    if not r:
        raise HTTPException(status_code=404, detail="Step not found.")
    return r
