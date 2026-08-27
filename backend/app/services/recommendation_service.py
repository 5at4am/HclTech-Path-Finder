from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Feedback, Learner, Resource
from ..schemas import (
    ProfileResponse,
    RecommendationOut,
    RecommendationsResponse,
    ResourceOut,
)
from ..ml.ml_adapter import get_model
from ..ml import evidence_engine as ee
from .path_generator import GOAL_EXPANSION

DIFF = {"beginner": 1, "intermediate": 2, "advanced": 3}

PREF_LEVEL = {"easy": 1, "medium": 2, "hard": 3}
EXP_LEVEL = {"beginner": 1, "intermediate": 2, "advanced": 3}


def _resource_out(r: Resource) -> ResourceOut:
    return ResourceOut(
        id=r.id, title=r.title, type=r.type, domain=r.domain,
        difficulty=r.difficulty, duration_hours=r.duration_hours,
        format=r.format, description=r.description,
        skills_gained=r.skills_gained or [], prerequisites=r.prerequisites or [],
        phase=r.phase, optional=bool(r.optional), rating=float(r.rating or 0.0),
    )


def _profile_response(learner: Learner) -> ProfileResponse:
    from .profile_service import _to_response
    return _to_response(learner)


def _score_resource(r, learner, gaps_set, interests_set, completed_set, model_scores, profile):
    skills = r.skills_gained or []
    # skill gap match
    if gaps_set:
        sgm = sum(1 for s in skills if s in gaps_set) / max(1, len(skills))
    else:
        sgm = 0.3
    # interest match
    im = 0.0
    if interests_set:
        if r.domain in interests_set:
            im = 1.0
        else:
            im = sum(1 for s in skills if s in interests_set) / max(1, len(skills))
    # prerequisite fit
    prereqs = r.prerequisites or []
    if prereqs:
        satisfied = sum(1 for p in prereqs if p in completed_set)
        pf = satisfied / len(prereqs)
    else:
        pf = 1.0
    # difficulty fit
    exp = EXP_LEVEL.get(learner.experience_level, 2)
    pref = PREF_LEVEL.get(learner.difficulty_preference, 2)
    target = (exp + pref) / 2
    df = max(0.2, 1 - abs(DIFF.get(r.difficulty, 2) - target) / 2.5)
    # time fit
    weekly = max(1, learner.study_time_per_week)
    weeks = r.duration_hours / weekly
    tf = max(0.2, 1 - max(0, weeks - 4) / 8)
    # model relevance
    mr = min(1.0, model_scores.get(r.id, 0.0) * 1.4)

    match = round(
        0.34 * sgm + 0.18 * im + 0.14 * pf + 0.10 * df + 0.10 * tf + 0.14 * mr,
        3,
    )
    return sgm, im, pf, df, tf, mr, match


def recommend(db: Session, learner_id: str, limit: int = 14) -> RecommendationsResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    resources = db.query(Resource).all()
    model = get_model(resources)
    profile_text = _build_profile_text(learner)
    model_scores = model.score(profile_text)
    # feedback bias — same as path generation so recommendations adapt instantly
    try:
        for fb in db.query(Feedback).filter(Feedback.learner_id == learner_id).all():
            if not fb.helpful and fb.reason in ("too_difficult","not_interested","too_long","not_relevant"):
                model_scores[fb.resource_id] = max(0.0, float(model_scores.get(fb.resource_id,0.0)) - 0.4)
            elif fb.helpful:
                model_scores[fb.resource_id] = min(1.0, float(model_scores.get(fb.resource_id,0.0)) + 0.15)
    except Exception:
        pass

    from .skill_gap_service import compute_gaps
    gaps, _ = compute_gaps(learner)
    gaps_set = {g.skill for g in gaps}
    interests_set = set(learner.interests or [])
    completed_set = set(learner.completed_courses or [])

    scored = []
    for r in resources:
        if r.id in completed_set:
            continue
        sgm, im, pf, df, tf, mr, match = _score_resource(
            r, learner, gaps_set, interests_set, completed_set, model_scores, profile_text
        )
        reason = _build_reason(r, sgm, gaps_set, pf)
        evidence = ee.explain(profile_text, r.title, k=4)
        evidence_score = round(evidence.similarity, 3)
        # Evidence Engine drives the Courses-tab match score; selection stays
        # deterministic (handled by path_generator).
        blended = round(0.6 * evidence_score + 0.4 * match, 3)
        scored.append(RecommendationOut(
            resource=_resource_out(r),
            evidence=evidence,
            model_relevance=round(mr, 3),
            skill_gap_match=round(sgm, 3),
            interest_match=round(im, 3),
            prerequisite_fit=round(pf, 3),
            difficulty_fit=round(df, 3),
            time_fit=round(tf, 3),
            evidence_score=evidence_score,
            match_score=blended,
            reason=reason,
        ))
    # rank: gap-addressing first, then match score
    scored.sort(key=lambda x: (x.skill_gap_match > 0, x.match_score), reverse=True)
    return RecommendationsResponse(learner_id=learner_id, recommendations=scored[:limit])


def _build_profile_text(learner: Learner) -> str:
    parts = [learner.goal or "", learner.target_role or ""]
    parts += learner.interests or []
    parts += learner.objectives or []
    parts += [f"experience {learner.experience_level}"]
    for s, lvl in (learner.current_skills or {}).items():
        if lvl >= 50:
            parts.append(s)
    text = " ".join(p for p in parts if p).lower()
    expansion = []
    for key, vocab in GOAL_EXPANSION.items():
        if key in text:
            expansion.append(vocab)
    if expansion:
        text = (text + " " + " ".join(expansion)).strip()
    return text


def _build_reason(r: Resource, sgm: float, gaps_set: set, pf: float) -> str:
    skills = r.skills_gained or []
    gap_skills = [s for s in skills if s in gaps_set]
    if gap_skills:
        named = ", ".join(g.replace("_", " ").title() for g in gap_skills[:3])
        base = f"Closes your gap in {named}."
    elif skills:
        named = ", ".join(s.replace("_", " ").title() for s in skills[:3])
        base = f"Builds {named} aligned with your goal."
    else:
        base = f"Supports your path toward {r.domain}."
    if pf < 1.0:
        base += " Complete its prerequisites first."
    return base
