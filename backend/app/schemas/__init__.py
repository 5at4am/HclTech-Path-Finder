from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------- Goals ----------
class GoalAnalysisRequest(BaseModel):
    goal: str
    learner_id: Optional[str] = None


class GoalAnalysisResponse(BaseModel):
    goal: str
    domain: str
    target_role: str
    timeline_months: Optional[int] = None
    objectives: list[str] = []
    detected_skills: list[str] = []
    missing_information: list[str] = []
    summary: str = ""


# ---------- Profile ----------
class ProfileCreate(BaseModel):
    learner_id: Optional[str] = None
    name: str = "Learner"
    goal: str = ""
    target_role: str = ""
    timeline_months: int = 6
    interests: list[str] = []
    experience_level: str = "beginner"
    current_skills: dict[str, int] = {}
    completed_courses: list[str] = []
    objectives: list[str] = []
    study_time_per_week: int = 6
    preferred_format: str = "video"
    preferred_pace: str = "moderate"
    difficulty_preference: str = "medium"
    learning_history: list[str] = []


class ProfileResponse(BaseModel):
    learner_id: str
    name: str
    goal: str
    target_role: str
    timeline_months: int
    interests: list[str]
    experience_level: str
    current_skills: dict[str, int]
    completed_courses: list[str]
    objectives: list[str]
    study_time_per_week: int
    preferred_format: str
    preferred_pace: str
    difficulty_preference: str
    learning_history: list[str]
    created_at: Optional[datetime] = None


class SkillGapItem(BaseModel):
    skill: str
    current_level: int
    required_level: int
    gap: int
    priority: int


class ProfileAnalysisResponse(BaseModel):
    learner: ProfileResponse
    skill_gaps: list[SkillGapItem]
    prerequisite_coverage_pct: int


# ---------- Resources / Recommendations ----------
class ResourceOut(BaseModel):
    id: str
    title: str
    type: str
    domain: str
    difficulty: str
    duration_hours: int
    format: str
    description: str
    skills_gained: list[str] = []
    prerequisites: list[str] = []
    phase: str = "Core"
    optional: bool = False
    rating: float = 0.0


class RecommendationOut(BaseModel):
    resource: ResourceOut
    model_relevance: float = 0.0
    skill_gap_match: float = 0.0
    interest_match: float = 0.0
    prerequisite_fit: float = 0.0
    difficulty_fit: float = 0.0
    time_fit: float = 0.0
    match_score: float = 0.0
    reason: str = ""


class RecommendationsResponse(BaseModel):
    learner_id: str
    recommendations: list[RecommendationOut]


# ---------- Path ----------
class LearningStepOut(BaseModel):
    id: str
    resource_id: str
    order: int
    phase: str
    status: str
    completion_percentage: int
    estimated_hours: int
    milestone: bool
    recommendation_score: float
    reason: str
    prerequisites: list[str] = []
    skills_gained: list[str] = []
    resource: ResourceOut
    unlocks: list[str] = []


class PathGenerateRequest(BaseModel):
    learner_id: str


class PathGenerateResponse(BaseModel):
    path_id: str
    learner_id: str
    goal: str
    target_role: str
    timeline_months: int
    study_time_per_week: int
    prerequisite_coverage_pct: int
    steps: list[LearningStepOut]


class PathOut(BaseModel):
    path_id: str
    learner_id: str
    goal: str
    target_role: str
    timeline_months: int
    study_time_per_week: int
    prerequisite_coverage_pct: int
    steps: list[LearningStepOut]


class SimulateRequest(BaseModel):
    learner_id: str
    changes: dict[str, Any] = {}


class SimulateResponse(BaseModel):
    current: dict[str, Any]
    simulated: dict[str, Any]
    changes_summary: list[str]
    steps: list[LearningStepOut]


# ---------- Progress ----------
class ProgressRequest(BaseModel):
    learner_id: str
    resource_id: str
    completion_percentage: int = 0
    status: Optional[str] = None
    time_spent_hours: float = 0.0


class ProgressResponse(BaseModel):
    learner_id: str
    resource_id: str
    completion_percentage: int
    status: str
    next_action: Optional[str] = None
    path_complete_pct: int = 0


# ---------- Feedback ----------
class FeedbackRequest(BaseModel):
    learner_id: str
    resource_id: str
    helpful: bool = True
    reason: str = ""


class FeedbackResponse(BaseModel):
    id: str
    adaptation: str = ""
    learner_id: str


# ---------- Mentor ----------
class MentorRequest(BaseModel):
    learner_id: str
    message: str


class MentorResponse(BaseModel):
    message: str
    sources: list[dict[str, Any]] = []


class MentorHistoryItem(BaseModel):
    role: str  # user | assistant
    message: str
    sources: list[dict[str, Any]] = []


# ---------- Dashboard ----------
class DashboardResponse(BaseModel):
    learner_id: str
    name: str
    goal: str
    target_role: str
    timeline_months: int
    study_time_per_week: int
    interests: list[str] = []
    path_id: Optional[str] = None
    path_complete_pct: int
    skills_covered: str
    streak_days: int
    hours_this_week: float
    continue_resource: Optional[ResourceOut] = None
    continue_pct: int = 0
    continue_remaining_hours: float = 0.0
    next_actions: list[str] = []
    skills: list[dict[str, Any]] = []
    priority_gaps: list[dict[str, Any]] = []
    recent_feedback: list[dict[str, Any]] = []


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    groq_configured: bool
