from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import MentorRequest, MentorResponse
from ..services.mentor_service import mentor_chat

router = APIRouter(prefix="/api/mentor", tags=["mentor"])


@router.post("/chat", response_model=MentorResponse)
async def chat(req: MentorRequest, db: Session = Depends(get_db)):
    if not req.message or not req.message.strip():
        return MentorResponse(message="Ask me anything about your learning path.")
    r = await mentor_chat(db, req.learner_id, req.message)
    return r or MentorResponse(message="Learner not found.")
