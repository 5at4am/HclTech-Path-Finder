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
from ..ml import evidence_engine as ee
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

# Maps each goal-expansion key to the catalog domains it implies, so a goal can
# be anchored to a track. "Frontend Developer" -> Frontend, etc. Used by
# _target_domains to keep generated paths on-topic instead of drifting.
GOAL_EXPANSION_DOMAIN: dict[str, set[str]] = {
    "frontend": {"Frontend"},
    "front-end": {"Frontend"},
    "backend": {"Backend"},
    "back-end": {"Backend"},
    "full stack": {"Frontend", "Backend", "Full Stack"},
    "mobile": {"Mobile"},
    "web": {"Frontend"},
    "data scien": {"Data Science"},
    "data analy": {"Data Analysis"},
    "machine learning": {"Machine Learning"},
    "deep learning": {"Deep Learning"},
    "generative": {"Generative AI"},
    "genai": {"Generative AI"},
    "ai/ml": {"Machine Learning", "Deep Learning", "Generative AI"},
    "ai engineer": {"Machine Learning", "Deep Learning", "Generative AI"},
    "ml engineer": {"Machine Learning", "Deep Learning", "Generative AI"},
    "nlp": {"NLP"},
    "computer vision": {"Computer Vision"},
    "cloud": {"Cloud"},
    "devops": {"DevOps"},
    "security": {"Security"},
    "database": {"Databases"},
    "blockchain": {"Blockchain"},
    "iot": {"Systems"},
    "statistics": {"Statistics"},
}


def _resource_out(r: Resource) -> ResourceOut:
    return ResourceOut(
        id=r.id, title=r.title, type=r.type, domain=r.domain,
        difficulty=r.difficulty, duration_hours=r.duration_hours,
        format=r.format, description=r.description,
        skills_gained=r.skills_gained or [], prerequisites=r.prerequisites or [],
        phase=r.phase, optional=bool(r.optional), rating=float(r.rating or 0.0),
    )


def build_unlocks(path_resource_ids: list[str], resources: list[Resource]) -> dict[str, list[str]]:
    """Reverse prerequisite map scoped to a path.

    Returns {resource_id: [titles of resources in the path that directly
    depend on it]} so every step can answer "what will this unlock?".
    """
    in_path = set(path_resource_ids)
    unlocks: dict[str, list[str]] = {rid: [] for rid in path_resource_ids}
    seen: dict[str, set[str]] = {}
    for r in resources:
        if r.id not in in_path:
            continue
        for pre in r.prerequisites or []:
            if pre in in_path and r.title not in seen.get(pre, set()):
                seen.setdefault(pre, set()).add(r.title)
                unlocks[pre].append(r.title)
    return unlocks


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


def _target_domains(learner: Learner) -> set[str]:
    """Map a learner's goal/role/interests to the catalog domains it targets."""
    text = _build_profile_text(learner)
    domains: set[str] = set()
    for key, doms in GOAL_EXPANSION_DOMAIN.items():
        if key in text:
            domains |= doms
    return domains


def _select_for_goal(
    resources: list[Resource],
    target_domains: set[str] | None = None,
    top_k: int = 14,
) -> list[Resource]:
    """Select the resources for a learner's path — deterministically.

    The ML model is NOT the selector. We choose by explicit catalog structure so
    the path is correct for every domain: in-domain resources first (or the whole
    catalog when the goal maps to no specific domain), then genuine prerequisites
    pulled in from any domain. Ordering is left to _order_for_path (topological +
    difficulty). The model still drives the "Match %"/reason text elsewhere, but it
    no longer decides *which* courses belong on the path — that's what previously
    let blockchain/Python/Flask leak into a Frontend plan.
    """
    in_domain = (
        [r for r in resources if r.domain in target_domains]
        if target_domains else list(resources)
    )
    picks = {r.id for r in in_domain[:top_k]}

    by_id = {r.id: r for r in resources}
    changed = True
    while changed:
        changed = False
        for rid in list(picks):
            for pre in by_id[rid].prerequisites or []:
                if pre in by_id and pre not in picks:
                    picks.add(pre)
                    changed = True
    # Stable, readable order: easier courses first, then by title.
    return sorted((by_id[i] for i in picks), key=lambda r: (DIFF_ORDER.get(r.difficulty, 1), r.title))


def _ensure_capstone(selected: list[Resource], resources: list[Resource], scores: dict[str, float] | None = None) -> list[Resource]:
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
    if scores:
        cands.sort(key=lambda r: scores.get(r.id, 0.0), reverse=True)
    return selected + [cands[0]]


def _order_for_path(resources: list[Resource]) -> list[Resource]:
    """Prerequisite-valid ordering that still prefers foundational courses first.

    Kahn's algorithm with a priority heap: among all currently unlocked
    resources, the easiest one goes next, so beginners see foundations first
    WITHOUT ever placing a resource before its prerequisite. Deterministic and
    model-free — order depends only on the catalog's difficulty + prerequisite DAG.
    """
    import heapq

    by_id = {r.id: r for r in resources}
    indeg = {r.id: 0 for r in resources}
    adj: dict[str, list[str]] = defaultdict(list)
    for r in resources:
        for pre in r.prerequisites or []:
            if pre in by_id:
                adj[pre].append(r.id)
                indeg[r.id] += 1

    def _key(rid: str) -> tuple:
        r = by_id[rid]
        return (DIFF_ORDER.get(r.difficulty, 1), rid)

    heap = [_key(rid) for rid, d in indeg.items() if d == 0]
    heapq.heapify(heap)
    out: list[Resource] = []
    while heap:
        _, rid = heapq.heappop(heap)
        out.append(by_id[rid])
        for nxt in adj[rid]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                heapq.heappush(heap, _key(nxt))
    # cycle safety: append anything unreachable
    seen = {r.id for r in out}
    out.extend(r for r in resources if r.id not in seen)
    return out


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
    _, coverage = compute_gaps(learner)

    # The ML model is used for *display* (Match %, reason wording) only — not for
    # selecting which courses belong on the path. Selection is deterministic.
    model = get_model(resources)
    profile_text = _build_profile_text(learner)
    model_scores = model.score(profile_text)
    target_domains = _target_domains(learner)

    included = _select_for_goal(resources, target_domains)
    included = _ensure_capstone(included, resources, model_scores)
    ordered = _order_for_path(included)

    completed_set = set()
    catalog_ids = {r.id for r in resources}
    steps: list[LearningStep] = []
    step_evidence: dict[str, object] = {}
    order_idx = 0
    current_assigned = False
    phases_seen = set()
    for r in ordered:
        is_completed = _is_completed(r, learner)
        # only prerequisites that exist as real resources can gate a step;
        # dangling ids (stale seed data) must not lock it forever
        prereqs = [p for p in (r.prerequisites or []) if p in catalog_ids]
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
        step_evidence[r.id] = ee.explain(profile_text, r.title, k=4)
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

    by_id = {r.id: r for r in resources}
    unlocks_map = build_unlocks([s.resource_id for s in steps], resources)
    step_outs = [
        LearningStepOut(
            id=s.id, resource_id=s.resource_id, order=s.order, phase=s.phase,
            status=s.status, completion_percentage=s.completion_percentage,
            estimated_hours=s.estimated_hours, milestone=bool(s.milestone),
            recommendation_score=float(s.recommendation_score), reason=s.reason,
            prerequisites=s.prerequisites or [], skills_gained=s.skills_gained or [],
            resource=_resource_out(by_id[s.resource_id]),
            unlocks=unlocks_map.get(s.resource_id, []),
            evidence=step_evidence.get(s.resource_id),
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
