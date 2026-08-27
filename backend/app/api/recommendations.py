from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import RecommendationsResponse
from ..services.recommendation_service import recommend
from ..services.profile_service import check_learner_access
from .auth import get_current_user_optional
from ..models import User

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/{learner_id}", response_model=RecommendationsResponse)
def get(learner_id: str, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    try:
        check_learner_access(db, learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    r = recommend(db, learner_id)
    if not r:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return r
