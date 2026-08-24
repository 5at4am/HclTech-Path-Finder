from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import GoalAnalysisRequest, GoalAnalysisResponse
from ..services.goal_service import analyze_goal

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.post("/analyze", response_model=GoalAnalysisResponse)
async def analyze(req: GoalAnalysisRequest):
    if not req.goal or not req.goal.strip():
        raise HTTPException(status_code=422, detail="A goal is required.")
    return await analyze_goal(req.goal)
