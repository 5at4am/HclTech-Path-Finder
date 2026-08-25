from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import FeedbackRequest, FeedbackResponse
from ..services.adaptive_service import apply_feedback

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackResponse)
def post(req: FeedbackRequest, db: Session = Depends(get_db)):
    if not req.resource_id:
        raise HTTPException(status_code=422, detail="resource_id required.")
    adaptation = apply_feedback(db, req.learner_id, req.resource_id, req.helpful, req.reason)
    if adaptation is None:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return FeedbackResponse(
        id=f"fb_{abs(hash(req.learner_id + req.resource_id)) % 10**9}",
        adaptation=adaptation, learner_id=req.learner_id,
    )
