from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Learner, LearningPath, LearningStep, Resource
from ..schemas import Evidence, MentorResponse
from ..ml import evidence_engine as ee
from .groq_service import SYSTEM_MENTOR, groq_chat, groq_available, prose_or_json
from .skill_gap_service import compute_gaps
from .path_generator import _build_profile_text


def _sanitize(message: str, allowed: set[str]) -> str:
    """Defensively strip any course name the evidence did not authorise.

    The LLM is instructed not to invent facts, but we enforce it: any course
    name from the known catalog that is not in ``allowed`` is redacted. This is
    what makes the "why" always trace to real evidence.
    """
    eng = ee.get_engine()
    if eng is None:
        return message
    for name in eng["course_names"]:
        if name and name not in allowed and name.lower() in message.lower():
            message = message.replace(name, "[another course]")
    return message


async def explain_step(db: Session, path_id: str, step_id: str) -> MentorResponse | None:
    step = db.get(LearningStep, step_id)
    if not step or step.path_id != path_id:
        return None
    path = db.get(LearningPath, path_id)
    resource = db.get(Resource, step.resource_id)
    learner = db.get(Learner, path.learner_id) if path else None

    gaps, _ = compute_gaps(learner) if learner else ([], 0)
    gaps_set = {g.skill for g in gaps}
    addressed = [s for s in (step.skills_gained or []) if s in gaps_set]
    prereq_coverage = 100
    if step.prerequisites:
        completed = set(learner.completed_courses or []) if learner else set()
        covered = sum(1 for p in step.prerequisites if p in completed)
        prereq_coverage = round(100 * covered / len(step.prerequisites))

    dependents = db.query(LearningStep).filter(LearningStep.path_id == path_id).all()
    unlocks = [d.resource_id for d in dependents if step.resource_id in (d.prerequisites or [])]

    profile_text = _build_profile_text(learner) if learner else (resource.title if resource else "")
    evidence: Evidence = (
        ee.explain(profile_text, resource.title, k=4) if resource else Evidence()
    )

    named = (
        ", ".join(a.replace("_", " ").title() for a in addressed[:3])
        or (resource.domain if resource else step.resource_id)
    )
    peer_txt = ", ".join(evidence.peer_courses[:3])
    sig = evidence.course_signatures

    # The strict, fact-only brief the LLM is allowed to rephrase.
    brief = (
        f"Course: {resource.title if resource else step.resource_id}\n"
        f"Why learners take it (real reviews): {'; '.join(sig[:3]) or 'n/a'}\n"
        f"Similar courses learners also explored: {peer_txt or 'n/a'}\n"
        f"Skill gap addressed: {', '.join(addressed) or 'general progression'}\n"
        f"Prerequisite coverage: {prereq_coverage}%\n"
        f"Unlocks: {', '.join(unlocks) or 'final goal'}\n"
    )

    allowed = {resource.title if resource else step.resource_id} | set(evidence.peer_courses)

    message = None
    if groq_available():
        prompt = (
            "Rephrase the following brief into 2-3 friendly sentences explaining why this "
            "step is recommended next. You MUST use ONLY the facts given. Keep the course "
            "name and the learner-review phrases verbatim. Do NOT introduce any other course "
            "or skill name that is not already in the brief.\n\n"
            f"{brief}"
        )
        raw = prose_or_json(await groq_chat(SYSTEM_MENTOR, prompt, temperature=0.2, max_tokens=600))
        if raw:
            message = _sanitize(raw, allowed)

    if not message:
        message = (
            f"\"{resource.title if resource else step.resource_id}\" is next on your path. "
        )
        if sig:
            message += f"Learners describe it as: {sig[0]} "
        message += f"It closes your gap in {named}."
        if peer_txt:
            message += f" Learners who took it also explored {peer_txt}."
        if prereq_coverage < 100:
            message += f" ({prereq_coverage}% of prerequisites already met.)"

    return MentorResponse(
        message=message,
        sources=[
            {"type": "path_step", "id": step.id},
            {"type": "evidence", "resource_id": resource.id if resource else None},
        ],
        evidence=evidence,
    )
