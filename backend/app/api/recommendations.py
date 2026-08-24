from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import RecommendationsResponse
from ..services.recommendation_service import recommend

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/{learner_id}", response_model=RecommendationsResponse)
def get(learner_id: str, db: Session = Depends(get_db)):
    r = recommend(db, learner_id)
    if not r:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return r
