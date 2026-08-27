from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import DashboardResponse
from ..services.dashboard_service import build_dashboard
from ..services.profile_service import check_learner_access
from .auth import get_current_user_optional
from ..models import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/{learner_id}", response_model=DashboardResponse)
def get(learner_id: str, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    try:
        check_learner_access(db, learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    d = build_dashboard(db, learner_id)
    if not d:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return d
