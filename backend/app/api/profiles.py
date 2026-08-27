from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ProfileCreate, ProfileResponse
from ..services.profile_service import create_profile, get_profile, check_learner_access, list_learners_for_user

from .auth import get_current_user_optional
from ..models import User

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("", response_model=ProfileResponse)
def create(req: ProfileCreate, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    try:
        return create_profile(db, req, user_id=current_user.id if current_user else None)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/list/me", response_model=list[ProfileResponse])
def list_my_learners(db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return list_learners_for_user(db, current_user.id)


@router.put("/{learner_id}", response_model=ProfileResponse)
def update(learner_id: str, req: ProfileCreate, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    try:
        learner = check_learner_access(db, learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not learner:
        raise HTTPException(status_code=404, detail="Learner not found.")
    # reuse create path with existing id
    req.learner_id = learner_id
    try:
        return create_profile(db, req, user_id=current_user.id if current_user else None)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{learner_id}", response_model=ProfileResponse)
def get(learner_id: str, db: Session = Depends(get_db), current_user: User | None = Depends(get_current_user_optional)):
    try:
        check_learner_access(db, learner_id, current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    p = get_profile(db, learner_id)
    if not p:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return p
