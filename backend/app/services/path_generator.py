from __future__ import annotations

import uuid
from collections import defaultdict
from sqlalchemy.orm import Session

from ..models import Learner, LearningPath, LearningStep, Resource
from ..schemas import (
    LearningStepOut,
    PathGenerateResponse,
    ResourceOut,
)
from .skill_gap_service import compute_gaps
from ..ml.ml_adapter import get_model
from .profile_service import _to_response

DIFF = {"beginner": 1, "intermediate": 2, "advanced": 3}
DIFF_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2}

# Expands a learner's goal/role into domain vocabulary so the ML model's
# TF-IDF query carries enough signal to rank the right courses first.
GOAL_EXPANSION = {
    "frontend": "html css javascript react vue angular typescript responsive web design ui frontend",
    "front-end": "html css javascript react vue angular typescript responsive web design ui frontend",
    "backend": "api server database django flask node spring rest graphql backend",
    "back-end": "api server database django flask node spring rest graphql backend",
    "full stack": "frontend backend react node django api fullstack",
    "mobile": "android ios flutter react native swift kotlin mobile",
    "web": "html css javascript react frontend web",
    "data scien": "data science statistics pandas analysis visualization",
    "data analy": "data analysis excel sql pandas visualization",
    "machine learning": "machine learning model training sklearn supervised unsupervised",
    "deep learning": "neural network deep learning tensorflow pytorch cnn rnn transformer",
    "generative": "llm rag prompt generative ai agent",
    "genai": "llm rag prompt generative ai agent",
    "nlp": "natural language processing nlp text",
    "computer vision": "computer vision opencv image detection",
    "cloud": "aws azure gcp cloud devops kubernetes docker",
    "devops": "devops docker kubernetes cicd pipeline linux",
    "security": "security hacking cybersecurity ethical penetration",
    "database": "sql postgres mongodb redis database query",
    "blockchain": "blockchain smart contract solidity web3 crypto",
    "iot": "iot embedded raspberry pi sensors",
    "statistics": "statistics probability hypothesis bayesian",
}


def _resource_out(r: Resource) -> ResourceOut:
    return ResourceOut(
        id=r.id, title=r.title, type=r.type, domain=r.domain,
        difficulty=r.difficulty, duration_hours=r.duration_hours,
        format=r.format, description=r.description,
        skills_gained=r.skills_gained or [], prerequisites=r.prerequisites or [],
        phase=r.phase, optional=bool(r.optional), rating=float(r.rating or 0.0),
    )


def _build_profile_text(learner: Learner) -> str:
    """Text the ML model matches the learner's goal against the course corpus."""
    parts = [learner.goal or "", learner.target_role or ""]
    parts += learner.interests or []
    parts += learner.objectives or []
    for skill, level in (learner.current_skills or {}).items():
        if level >= 50:
            parts.append(skill)
    text = " ".join(p for p in parts if p).lower()
    # Expand the goal with domain vocabulary so the TF-IDF query is specific.
    expansion = []
    for key, vocab in GOAL_EXPANSION.items():
        if key in text:
            expansion.append(vocab)
    if expansion:
        text = (text + " " + " ".join(expansion)).strip()
    return text


def _gap_boost(r: Resource, gap_terms: set[str]) -> float:
    """1.0 when a course's domain/title/skills match one of the learner's priority gaps."""
    if not gap_terms:
        return 0.0
    hay = (r.domain + " " + r.title + " " + " ".join(r.skills_gained or [])).lower()
    for t in gap_terms:
        if t.replace("_", " ") in hay:
            return 1.0
    return 0.0


def _select_for_goal(resources: list[Resource], model_scores: dict[str, float], top_k: int = 16) -> list[Resource]:
    """Rank courses by model relevance to the learner's goal.

    Uses the TF-IDF + cosine similarity model from Model/solution.py (via
    ml_adapter) so a "Frontend" goal returns frontend courses, not ML ones.
    Prerequisites of selected courses are pulled in so advanced courses aren't
    left permanently "locked".
    """
    ranked = sorted(resources, key=lambda r: model_scores.get(r.id, 0.0), reverse=True)
    positive = [r for r in ranked if model_scores.get(r.id, 0.0) > 0]
    if len(positive) >= 4:
        picks = positive[:top_k]
    else:
        picks = ranked[:top_k]

    by_id = {r.id: r for r in resources}
    selected = set(p.id for p in picks)
    changed = True
    while changed:
        changed = False
        for rid in list(selected):
            for pre in by_id[rid].prerequisites or []:
                if pre in by_id and pre not in selected:
                    selected.add(pre)
                    changed = True
    picks = [by_id[i] for i in selected]
    picks.sort(key=lambda r: model_scores.get(r.id, 0.0), reverse=True)
    return picks


def _ensure_capstone(selected: list[Resource], resources: list[Resource], scores: dict[str, float]) -> list[Resource]:
    """Append a portfolio project for the dominant domain if none is present."""
    if any(r.type == "project" for r in selected) or not selected:
        return selected
    domains = [r.domain for r in selected]
    domain = max(set(domains), key=domains.count)
    cands = [r for r in resources if r.type == "project" and r.domain == domain]
    if not cands:
        cands = [r for r in resources if r.type == "project"]
    if not cands:
        return selected
    cands.sort(key=lambda r: scores.get(r.id, 0.0), reverse=True)
    return selected + [cands[0]]


def _order_for_path(resources: list[Resource], model_scores: dict[str, float]) -> list[Resource]:
    """Present foundational courses first, then more advanced ones."""
    return sorted(
        resources,
        key=lambda r: (DIFF_ORDER.get(r.difficulty, 1), -model_scores.get(r.id, 0.0)),
    )



def _topo_sort(resources: list[Resource]) -> list[Resource]:
    by_id = {r.id: r for r in resources}
    indeg = {r.id: 0 for r in resources}
    adj = defaultdict(list)
    for r in resources:
        for pre in r.prerequisites or []:
            if pre in by_id:
                adj[pre].append(r.id)
                indeg[r.id] += 1
    from collections import deque
    q = deque([rid for rid, d in indeg.items() if d == 0])
    order = []
    while q:
        rid = q.popleft()
        order.append(rid)
        for nxt in adj[rid]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                q.append(nxt)
    # append any remaining (cycle safety)
    seen = set(order)
    for r in resources:
        if r.id not in seen:
            order.append(r.id)
    return [by_id[i] for i in order]


def _is_completed(r: Resource, learner: Learner) -> bool:
    if r.id in (learner.completed_courses or []):
        return True
    skills = r.skills_gained or []
    cur = learner.current_skills or {}
    if not skills:
        return False
    return all(int(cur.get(s, 0)) >= 75 for s in skills)


def _reason(r: Resource, learner: Learner, model_scores: dict[str, float]) -> str:
    score = model_scores.get(r.id, 0.0)
    role = (learner.target_role or learner.goal or "your goal").strip()
    if score >= 0.05:
        return f"Top match for your '{role}' goal — strengthens your {r.domain} skills."
    if r.skills_gained:
        named = ", ".join(s.replace("_", " ").title() for s in r.skills_gained[:3])
        return f"Builds {named} aligned with your {r.domain} track."
    return f"Supports your {r.domain} learning track."


def generate(db: Session, learner_id: str) -> PathGenerateResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    resources = db.query(Resource).all()
    gaps, coverage = compute_gaps(learner)

    # Rank courses for this learner's goal using the ML model.
    model = get_model(resources)
    profile_text = _build_profile_text(learner)
    model_scores = model.score(profile_text)

    # Blend the model's goal relevance with the learner's priority gaps so that
    # courses addressing their weakest required skills are surfaced too.
    gap_terms = {g.skill.lower() for g in gaps}
    scores = {
        r.id: 0.75 * model_scores.get(r.id, 0.0) + 0.25 * _gap_boost(r, gap_terms)
        for r in resources
    }

    included = _select_for_goal(resources, scores)
    included = _ensure_capstone(included, resources, scores)
    ordered = _order_for_path(included, scores)

    # dependency map for unlocks
    dependents: dict[str, list[str]] = defaultdict(list)
    by_id = {r.id: r for r in resources}
    for r in resources:
        for pre in r.prerequisites or []:
            dependents[pre].append(r.id)

    completed_set = set()
    steps: list[LearningStep] = []
    order_idx = 0
    current_assigned = False
    phases_seen = set()
    for r in ordered:
        is_completed = _is_completed(r, learner)
        prereqs = r.prerequisites or []
        prereqs_satisfied = all(p in completed_set for p in prereqs)
        if is_completed:
            status = "completed"
            completed_set.add(r.id)
        elif not prereqs_satisfied:
            status = "locked"
        elif not current_assigned:
            status = "current"
            current_assigned = True
        else:
            status = "optional" if r.optional else "recommended"

        milestone = (r.phase not in phases_seen) or (r.type == "project" and not r.optional)
        phases_seen.add(r.phase)

        step = LearningStep(
            id=f"step_{uuid.uuid4().hex[:10]}",
            path_id="",  # set after path created
            resource_id=r.id,
            order=order_idx,
            phase=r.phase,
            status=status,
            completion_percentage=100 if is_completed else 0,
            estimated_hours=r.duration_hours,
            milestone=milestone,
            recommendation_score=round(model_scores.get(r.id, 0.0), 3),
            reason=_reason(r, learner, model_scores),
            prerequisites=list(prereqs),
            skills_gained=list(r.skills_gained or []),
        )
        steps.append(step)
        order_idx += 1
        if is_completed:
            completed_set.add(r.id)

    # total hours / timeline
    total_hours = sum(s.estimated_hours for s in steps)
    weekly = max(1, learner.study_time_per_week)
    est_weeks = total_hours / weekly
    est_months = max(1, round(est_weeks / 4.3))

    # persist path
    path = LearningPath(
        id=f"path_{uuid.uuid4().hex[:10]}",
        learner_id=learner.id,
        goal=learner.goal,
        target_role=learner.target_role,
        timeline_months=learner.timeline_months,
        study_time_per_week=learner.study_time_per_week,
    )
    db.add(path)
    db.flush()
    for s in steps:
        s.path_id = path.id
        db.add(s)
    db.commit()

    step_outs = [
        LearningStepOut(
            id=s.id, resource_id=s.resource_id, order=s.order, phase=s.phase,
            status=s.status, completion_percentage=s.completion_percentage,
            estimated_hours=s.estimated_hours, milestone=bool(s.milestone),
            recommendation_score=float(s.recommendation_score), reason=s.reason,
            prerequisites=s.prerequisites or [], skills_gained=s.skills_gained or [],
            resource=_resource_out(by_id[s.resource_id]),
            unlocks=[d for d in dependents.get(s.resource_id, []) if d in {x.resource_id for x in steps}],
        )
        for s in steps
    ]

    return PathGenerateResponse(
        path_id=path.id,
        learner_id=learner.id,
        goal=learner.goal,
        target_role=learner.target_role,
        timeline_months=est_months,
        study_time_per_week=learner.study_time_per_week,
        prerequisite_coverage_pct=coverage,
        steps=step_outs,
    )
