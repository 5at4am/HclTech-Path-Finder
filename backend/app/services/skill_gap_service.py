from __future__ import annotations

import re

from sqlalchemy.orm import Session

from ..models import Learner, Resource, Skill
from ..schemas import ProfileAnalysisResponse, ProfileResponse, SkillGapItem
from ..seed import SKILLS as _SKILL_ROWS
# Required skill levels (0-100) per target role. Each role only lists the
# skills that actually belong to that domain, so a Frontend path no longer
# requires machine learning.
ROLE_REQUIREMENTS = {
    "Frontend Developer": {
        "html": 75, "css": 70, "javascript": 80, "typescript": 55, "react": 65,
        "responsive_design": 60, "ui_ux": 50, "nodejs": 25, "portfolio": 65,
    },
    "Backend Developer": {
        "python": 55, "java": 45, "nodejs": 65, "rest_api": 70, "sql": 60,
        "postgres": 55, "authentication": 55, "docker": 40, "spring_boot": 45,
        "portfolio": 60,
    },
    "Full Stack Developer": {
        "html": 65, "css": 60, "javascript": 75, "react": 60, "nodejs": 65,
        "rest_api": 65, "sql": 55, "postgres": 50, "docker": 40, "portfolio": 65,
    },
    "Mobile Developer": {
        "javascript": 50, "react_native": 60, "flutter": 60, "swift": 45,
        "android": 45, "ui_ux": 45, "portfolio": 65,
    },
    "Data Analyst": {
        "python": 60, "sql": 70, "pandas": 65, "data_analysis": 75, "excel": 50,
        "statistics": 50, "data_viz": 65, "tableau": 45, "portfolio": 55,
    },
    "Data Scientist": {
        "python": 80, "sql": 60, "statistics": 75, "probability": 65, "pandas": 70,
        "data_analysis": 75, "machine_learning": 65, "feature_engineering": 55,
        "model_evaluation": 60, "data_viz": 50, "portfolio": 60,
    },
    "AI/ML Engineer": {
        "python": 80, "sql": 50, "statistics": 65, "probability": 55, "pandas": 60,
        "machine_learning": 75, "feature_engineering": 60, "model_evaluation": 70,
        "deep_learning": 50, "neural_networks": 45, "deployment": 50, "mlops": 45,
        "portfolio": 70,
    },
    "GenAI Engineer": {
        "python": 75, "machine_learning": 55, "deep_learning": 40, "llms": 75,
        "rag": 70, "agentic_ai": 60, "prompt_engineering": 60, "deployment": 45,
        "portfolio": 70,
    },
    "Cloud Engineer": {
        "linux": 65, "docker": 70, "kubernetes": 65, "aws": 70, "azure": 50,
        "cloud_native": 60, "deployment": 60, "ci_cd": 50, "portfolio": 50,
    },
    "DevOps Engineer": {
        "linux": 70, "docker": 75, "kubernetes": 70, "ci_cd": 65, "aws": 55,
        "cloud_native": 55, "deployment": 65, "python": 40, "portfolio": 50,
    },
    "Security Engineer": {
        "linux": 55, "cybersecurity": 75, "ethical_hacking": 65, "networking": 40,
        "cloud_native": 30, "python": 35, "portfolio": 55,
    },
    "Blockchain Developer": {
        "javascript": 45, "blockchain": 75, "solidity": 70, "react": 35, "portfolio": 60,
    },
}


GENERIC = {
    "python": 65, "javascript": 55, "sql": 50, "html": 45, "css": 45,
    "data_analysis": 50, "statistics": 45, "deployment": 40, "portfolio": 60,
}

# Canonical skill-id lookup so free-form inputs ("Python", "Machine Learning",
# "machine learning") all resolve to ontology ids like python/machine_learning.
_SLUG = re.compile(r"[^a-z0-9]+")
_SKILL_KEY_TO_ID: dict[str, str] = {}
for _sid, _name, _dom in _SKILL_ROWS:
    _SKILL_KEY_TO_ID[_name.lower()] = _sid
    _SKILL_KEY_TO_ID.setdefault(_SLUG.sub("_", _sid.lower()).strip("_"), _sid)
    _SKILL_KEY_TO_ID.setdefault(_SLUG.sub("_", _name.lower()).strip("_"), _sid)


def normalize_current_skills(raw: dict | None) -> dict[str, int]:
    """Map arbitrary skill keys to canonical ontology ids.

    Profiles receive current_skills from Groq goal parsing and the UI, which use
    display names ("Python", "REST API") while gap analysis and dashboards key
    by ontology id ("python", "rest_api"). Without normalization every lookup
    silently misses and coverage reads 0%.
    """
    out: dict[str, int] = {}
    for k, v in (raw or {}).items():
        try:
            lvl = max(0, min(100, int(v)))
        except (TypeError, ValueError):
            continue
        key = str(k).strip().lower()
        sid = _SKILL_KEY_TO_ID.get(key) or _SKILL_KEY_TO_ID.get(_SLUG.sub("_", key).strip("_"))
        if sid is None:
            sid = _SLUG.sub("_", key).strip("_")
        out[sid] = max(out.get(sid, 0), lvl)
    return out


def required_for(role: str, goal: str) -> dict[str, int]:
    if role in ROLE_REQUIREMENTS:
        return ROLE_REQUIREMENTS[role]
    g = (goal or "").lower()
    rules = [
        ("genai", "GenAI Engineer"), ("generative", "GenAI Engineer"),
        ("llm", "GenAI Engineer"), ("rag", "GenAI Engineer"),
        ("front", "Frontend Developer"), ("web developer", "Frontend Developer"),
        ("back end", "Backend Developer"), ("backend", "Backend Developer"),
        ("full stack", "Full Stack Developer"), ("fullstack", "Full Stack Developer"),
        ("mobile", "Mobile Developer"), ("android", "Mobile Developer"),
        ("ios", "Mobile Developer"), ("flutter", "Mobile Developer"),
        ("data analy", "Data Analyst"), ("data analysis", "Data Analyst"),
        ("data scien", "Data Scientist"), ("data science", "Data Scientist"),
        ("machine learning", "AI/ML Engineer"), ("deep learning", "AI/ML Engineer"),
        ("ai engineer", "AI/ML Engineer"), ("ml engineer", "AI/ML Engineer"),
        ("cloud", "Cloud Engineer"), ("devops", "DevOps Engineer"),
        ("security", "Security Engineer"), ("cyber", "Security Engineer"),
        ("blockchain", "Blockchain Developer"), ("web3", "Blockchain Developer"),
    ]
    for key, mapped in rules:
        if key in g:
            return ROLE_REQUIREMENTS[mapped]
    return GENERIC


def compute_gaps(learner: Learner) -> tuple[list[SkillGapItem], int]:
    required = required_for(learner.target_role, learner.goal)
    current = normalize_current_skills(learner.current_skills)
    gaps: list[SkillGapItem] = []
    covered = 0
    for skill, req_level in required.items():
        cur = int(current.get(skill, 0))
        gap = max(0, req_level - cur)
        if cur >= req_level * 0.6:
            covered += 1
        if gap > 0:
            gaps.append(SkillGapItem(
                skill=skill, current_level=cur, required_level=req_level,
                gap=gap, priority=0,
            ))
    gaps.sort(key=lambda x: x.gap, reverse=True)
    for i, g in enumerate(gaps, start=1):
        g.priority = i
    coverage = round(100 * covered / max(1, len(required)))
    return gaps, coverage


def analyze_profile(db: Session, learner_id: str) -> ProfileAnalysisResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    gaps, coverage = compute_gaps(learner)
    return ProfileAnalysisResponse(
        learner=_profile_response(learner),
        skill_gaps=gaps,
        prerequisite_coverage_pct=coverage,
    )


def _profile_response(learner: Learner) -> ProfileResponse:
    from .profile_service import _to_response
    return _to_response(learner)
