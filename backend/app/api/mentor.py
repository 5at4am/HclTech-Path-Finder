from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import MentorHistoryItem, MentorRequest, MentorResponse
from ..models import Conversation
from ..services.mentor_service import mentor_chat

router = APIRouter(prefix="/api/mentor", tags=["mentor"])


@router.post("/chat", response_model=MentorResponse)
async def chat(req: MentorRequest, db: Session = Depends(get_db)):
    if not req.message or not req.message.strip():
        return MentorResponse(message="Ask me anything about your learning path.")
    r = await mentor_chat(db, req.learner_id, req.message)
    if r is None:
        raise HTTPException(status_code=404, detail="Learner not found.")
    return r


@router.get("/history/{learner_id}", response_model=list[MentorHistoryItem])
def history(learner_id: str, limit: int = 50, db: Session = Depends(get_db)):
    rows = (
        db.query(Conversation)
        .filter(Conversation.learner_id == learner_id)
        .order_by(Conversation.created_at.desc(), Conversation.id.desc())
        .limit(max(1, min(limit, 200)))
        .all()
    )
    rows.reverse()
    return [
        MentorHistoryItem(role=r.role, message=r.message or "", sources=r.sources or [])
        for r in rows
    ]
