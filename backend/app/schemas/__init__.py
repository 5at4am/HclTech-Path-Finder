from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

_LEARNER_ID_RE = re.compile(r"^[A-Za-z0-9_\-]{1,64}$")


def _clamp_int(v: Any, lo: int, hi: int, default: int) -> int:
    try:
        return max(lo, min(hi, int(v)))
    except (TypeError, ValueError):
        return default


def _clean_str_list(items: Any, limit: int, item_len: int = 80) -> list[str]:
    out: list[str] = []
    for it in items or []:
        s = str(it).strip()[:item_len]
        if s:
            out.append(s)
        if len(out) >= limit:
            break
    return out


# ---------- Goals ----------
class GoalAnalysisRequest(BaseModel):
    goal: str = Field(min_length=1, max_length=600)

    @field_validator("goal")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


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
    learner_id: Optional[str] = Field(default=None, pattern=r"^[A-Za-z0-9_\-]{1,64}$")
    name: str = Field(default="Learner", max_length=80)
    goal: str = Field(default="", max_length=600)
    target_role: str = Field(default="", max_length=80)
    timeline_months: int = 6
    interests: list[str] = []
    experience_level: str = Field(default="beginner", max_length=20)
    current_skills: dict[str, int] = {}
    completed_courses: list[str] = []
    objectives: list[str] = []
    study_time_per_week: int = 6
    preferred_format: str = Field(default="video", max_length=20)
    preferred_pace: str = Field(default="moderate", max_length=20)
    difficulty_preference: str = Field(default="medium", max_length=20)
    learning_history: list[str] = []

    @field_validator("name", "goal", "target_role")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    @field_validator("timeline_months")
    @classmethod
    def _timeline(cls, v: int) -> int:
        return _clamp_int(v, 1, 60, 6)

    @field_validator("study_time_per_week")
    @classmethod
    def _study(cls, v: int) -> int:
        return _clamp_int(v, 1, 80, 6)

    @field_validator("interests", "objectives")
    @classmethod
    def _short_lists(cls, v: list[str]) -> list[str]:
        return _clean_str_list(v, limit=20)

    @field_validator("completed_courses", "learning_history")
    @classmethod
    def _id_lists(cls, v: list[str]) -> list[str]:
        return _clean_str_list(v, limit=200, item_len=100)

    @field_validator("current_skills")
    @classmethod
    def _skills(cls, v: dict[str, int]) -> dict[str, int]:
        out: dict[str, int] = {}
        for k, val in list((v or {}).items())[:60]:
            key = str(k).strip()[:40]
            if key:
                out[key] = _clamp_int(val, 0, 100, 0)
        return out


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


class Evidence(BaseModel):
    """Grounded proof behind a "why", sourced from real course reviews.

    Never fabricated by the LLM: every field traces to the Evidence Engine
    (``app.ml.evidence_engine``) which mines distinctive review sentences.
    """

    course_signatures: list[str] = []
    matched_signatures: list[str] = []
    similarity: float = 0.0
    peer_courses: list[str] = []
    source: str = "evidence_engine"


class RecommendationOut(BaseModel):
    resource: ResourceOut
    evidence: Evidence | None = None
    model_relevance: float = 0.0
    skill_gap_match: float = 0.0
    interest_match: float = 0.0
    prerequisite_fit: float = 0.0
    difficulty_fit: float = 0.0
    time_fit: float = 0.0
    evidence_score: float = 0.0
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
    evidence: Evidence | None = None


class PathGenerateRequest(BaseModel):
    learner_id: str = Field(min_length=1, max_length=64)


class PathGenerateResponse(BaseModel):
    path_id: str
    learner_id: str
    goal: str
    target_role: str
    timeline_months: int
    study_time_per_week: int
    prerequisite_coverage_pct: int
    steps: list[LearningStepOut]


class AdaptResponse(PathGenerateResponse):
    """PathGenerateResponse + diff metadata for the improved Adapt dialog."""

    previous_path_id: str | None = None
    added_resource_ids: list[str] = []
    removed_resource_ids: list[str] = []
    added_titles: list[str] = []
    removed_titles: list[str] = []
    kept_count: int = 0
    changes_summary: list[str] = []


class PathOut(BaseModel):
    path_id: str
    learner_id: str
    goal: str
    target_role: str
    timeline_months: int
    study_time_per_week: int
    prerequisite_coverage_pct: int
    steps: list[LearningStepOut]


_ALLOWED_SIMULATE_KEYS = {"study_time_per_week", "experience_level", "preferred_pace",
                          "difficulty_preference", "add_interest"}


class SimulateRequest(BaseModel):
    learner_id: str = Field(min_length=1, max_length=64)
    changes: dict[str, Any] = {}

    @field_validator("changes")
    @classmethod
    def _sanitize(cls, v: dict[str, Any]) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for k, val in (v or {}).items():
            if k not in _ALLOWED_SIMULATE_KEYS:
                continue
            if k == "study_time_per_week":
                out[k] = _clamp_int(val, 1, 80, 6)
            elif isinstance(val, str) and val.strip():
                out[k] = val.strip()[:40]
        return out


class SimulateResponse(BaseModel):
    current: dict[str, Any]
    simulated: dict[str, Any]
    changes_summary: list[str]
    steps: list[LearningStepOut]


# ---------- Progress ----------
class ProgressRequest(BaseModel):
    learner_id: str = Field(min_length=1, max_length=64)
    resource_id: str = Field(min_length=1, max_length=100)
    completion_percentage: int = Field(default=0, ge=0, le=100)
    status: Optional[str] = Field(default=None, max_length=20)
    time_spent_hours: float = Field(default=0.0, ge=0, le=1000)


class ProgressResponse(BaseModel):
    learner_id: str
    resource_id: str
    completion_percentage: int
    status: str
    next_action: Optional[str] = None
    path_complete_pct: int = 0


# ---------- Feedback ----------
class FeedbackRequest(BaseModel):
    learner_id: str = Field(min_length=1, max_length=64)
    resource_id: str = Field(min_length=1, max_length=100)
    helpful: bool = True
    reason: str = Field(default="", max_length=40)


class FeedbackResponse(BaseModel):
    id: str
    adaptation: str = ""
    learner_id: str


# ---------- Mentor ----------
class MentorRequest(BaseModel):
    learner_id: str = Field(min_length=1, max_length=64)
    message: str = Field(min_length=1, max_length=1000)


class MentorResponse(BaseModel):
    message: str
    sources: list[dict[str, Any]] = []
    evidence: Evidence | None = None


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
    continue_unlocks: list[str] = []
    continue_reason: str = ""
    next_actions: list[str] = []
    skills: list[dict[str, Any]] = []
    priority_gaps: list[dict[str, Any]] = []
    recent_feedback: list[dict[str, Any]] = []


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    groq_configured: bool


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=6, max_length=128)

    @field_validator("name", "email", "password")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address.")
        return v


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
