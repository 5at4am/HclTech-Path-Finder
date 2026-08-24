from __future__ import annotations

from ..schemas import GoalAnalysisResponse
from .groq_service import parse_goal


async def analyze_goal(goal: str) -> GoalAnalysisResponse:
    data = await parse_goal(goal)
    return GoalAnalysisResponse(**data)
