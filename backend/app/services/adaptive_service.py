from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Feedback, Learner, Resource
from .skill_gap_service import normalize_current_skills


def apply_feedback(
    db: Session,
    learner_id: str,
    resource_id: str,
    helpful: bool,
    reason: str,
) -> str:
    learner = db.get(Learner, learner_id)
    resource = db.get(Resource, resource_id)
    if not learner:
        return "No learner found."
    fb = Feedback(learner_id=learner_id, resource_id=resource_id, helpful=helpful, reason=reason or "")
    db.add(fb)

    adaptation = ""
    if helpful:
        adaptation = f"Thanks — \"{resource.title if resource else resource_id}\" will stay prioritized in your path."
    else:
        cur = normalize_current_skills(learner.current_skills)
        completed = set(learner.completed_courses or [])
        interests = list(learner.interests or [])
        if reason == "too_difficult":
            learner.difficulty_preference = {"hard": "medium", "medium": "easy", "easy": "easy"}[learner.difficulty_preference]
            adaptation = ("We reduced the difficulty of future recommendations and ensured "
                         "more prerequisite material appears before this topic.")
        elif reason == "already_know":
            for sk in resource.skills_gained or [] if resource else []:
                cur[sk] = max(int(cur.get(sk, 0)), 90)
            learner.current_skills = cur
            completed.add(resource_id)
            learner.completed_courses = list(completed)
            adaptation = "We marked this as known, raised your skill estimate, and moved you forward past it."
        elif reason == "not_interested":
            if resource and resource.domain in interests:
                interests.remove(resource.domain)
                learner.interests = interests
            adaptation = "We lowered the weight of this topic in future recommendations."
        elif reason == "too_long":
            learner.preferred_pace = {"fast": "moderate", "moderate": "slow", "slow": "slow"}[learner.preferred_pace]
            adaptation = "We adjusted your pace and favored shorter modules going forward."
        elif reason == "not_relevant":
            if resource:
                learner.objectives = [o for o in (learner.objectives or []) if resource.domain.lower() not in o.lower()]
            adaptation = "We deprioritized this resource since it isn't relevant to your goal."
        else:
            adaptation = "We recorded your feedback and will factor it into future recommendations."
    db.commit()
    return adaptation
