from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import ProfileCreate, ProfileResponse
from ..services.profile_service import create_profile, get_profile

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("", response_model=ProfileResponse)
def create(req: ProfileCreate, db: Session = Depends(get_db)):
    return create_profile(db, req)


@router.get("/{learner_id}", response_model=ProfileResponse)
def get(learner_id: str, db: Session = Depends(get_db)):
    p = get_profile(db, learner_id)
    if not p:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return p
