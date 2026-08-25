from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ProgressRequest, ProgressResponse
from ..services.progress_service import update_progress

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.post("", response_model=ProgressResponse)
def post(req: ProgressRequest, db: Session = Depends(get_db)):
    r = update_progress(
        db, req.learner_id, req.resource_id,
        completion_percentage=req.completion_percentage,
        status=req.status, time_spent_hours=req.time_spent_hours,
    )
    if not r:
        raise HTTPException(status_code=404, detail="Learner or resource not found.")
    return r


@router.get("/{learner_id}", response_model=dict)
def get_progress(learner_id: str, db: Session = Depends(get_db)):
    from ..models import Learner, Progress
    if not db.get(Learner, learner_id):
        raise HTTPException(status_code=404, detail="Learner not found.")
    rows = db.query(Progress).filter(Progress.learner_id == learner_id).all()
    return {
        "learner_id": learner_id,
        "progress": [
            {"resource_id": p.resource_id, "completion_percentage": p.completion_percentage,
             "status": p.status, "time_spent_hours": p.time_spent_hours}
            for p in rows
        ],
    }
