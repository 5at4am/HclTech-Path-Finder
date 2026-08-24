from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Learner, LearningPath, LearningStep, Resource
from ..schemas import MentorResponse
from .groq_service import SYSTEM_MENTOR, groq_chat, groq_available, prose_or_json
from .skill_gap_service import compute_gaps


def _evidence(resource: Resource | None, k: int = 2) -> list[str]:
    """Pull short, real learner-review snippets from the resource description."""
    if not resource or not resource.description:
        return []
    parts = [p.strip().rstrip(".") for p in resource.description.split(". ") if 20 <= len(p.strip()) <= 180]
    return parts[:k]


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

    dependents = (
        db.query(LearningStep)
        .filter(LearningStep.path_id == path_id)
        .all()
    )
    unlocks = [d.resource_id for d in dependents if step.resource_id in (d.prerequisites or [])]

    structured = (
        f"Skill gap addressed: {', '.join(addressed) or 'general progression'}.\n"
        f"Prerequisite coverage: {prereq_coverage}%.\n"
        f"Unlocks: {', '.join(unlocks) or 'final goal'}."
    )

    message = None
    if groq_available():
        prompt = (
            "Explain in 2-3 friendly sentences why this learning step is recommended next. "
            "Use ONLY these facts:\n"
            f"Step: {resource.title if resource else step.resource_id}\n"
            f"{structured}\n"
            "Do not invent facts."
        )
        message = prose_or_json(await groq_chat(SYSTEM_MENTOR, prompt, temperature=0.3, max_tokens=1200))

    if not message:
        named = ", ".join(a.replace("_", " ").title() for a in addressed[:3]) or (resource.domain if resource else step.resource_id)
        message = (
            f"\"{resource.title if resource else step.resource_id}\" is next because it closes your gap in "
            f"{named}. {prereq_coverage}% of its prerequisites are already met, and finishing it unlocks "
            f"{', '.join(unlocks) or 'your goal'}."
        )

    # Append real learner-review evidence so the rationale is grounded in data.
    quotes = _evidence(resource)
    if quotes:
        message += "\n\nWhat learners say:\n" + "\n".join(f"“{q}.”" for q in quotes)

    return MentorResponse(
        message=message,
        sources=[{"type": "path_step", "id": step.id}]
        + [{"type": "learner_review", "resource_id": resource.id} for _ in quotes],
    )
