from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Conversation, Learner, LearningPath, LearningStep, Resource
from ..schemas import MentorResponse
from .groq_service import SYSTEM_HEURISTIC, groq_chat, groq_available
from .skill_gap_service import compute_gaps
from .profile_service import _to_response


def _context_block(db: Session, learner: Learner) -> tuple[str, list[dict]]:
    path = (
        db.query(LearningPath)
        .filter(LearningPath.learner_id == learner.id)
        .order_by(LearningPath.created_at.desc())
        .first()
    )
    steps = []
    sources = []
    if path:
        steps = (
            db.query(LearningStep)
            .filter(LearningStep.path_id == path.id)
            .order_by(LearningStep.order)
            .all()
        )
    gaps, _ = compute_gaps(learner)
    lines = [f"Learner goal: {learner.goal}", f"Target role: {learner.target_role}",
             f"Timeline: {learner.timeline_months} months", f"Study time: {learner.study_time_per_week} hrs/week",
             f"Experience: {learner.experience_level}"]
    lines.append("Current skills: " + ", ".join(f"{k} {v}%" for k, v in (learner.current_skills or {}).items()))
    lines.append("Priority gaps: " + ", ".join(g.skill.replace("_", " ") for g in gaps[:5]))
    if steps:
        lines.append("Learning path (in order):")
        for s in steps:
            r = db.get(Resource, s.resource_id)
            pre = ", ".join(s.prerequisites) if s.prerequisites else "none"
            lines.append(f"- {r.title if r else s.resource_id} | status={s.status} | prereqs=[{pre}] | skills={', '.join(s.skills_gained)}")
            sources.append({"type": "path_step", "id": s.id})
    return "\n".join(lines), sources


def _rule_based(db: Session, learner: Learner, message: str, ctx_steps) -> tuple[str, list[dict]]:
    m = message.lower()
    db_resources = {r.id: r for r in db.query(Resource).all()}
    src = []
    if "why" in m and ("next" in m or "this" in m or "course" in m):
        cur = next((s for s in ctx_steps if s.status in ("current", "recommended")), None)
        if cur:
            r = db_resources.get(cur.resource_id)
            src = [{"type": "path_step", "id": cur.id}]
            return (f"\"{r.title}\" is next because it builds the skills you still need "
                    f"({', '.join(cur.skills_gained)}) and its prerequisites "
                    f"({', '.join(cur.prerequisites) or 'none'}) are satisfied. "
                    f"Completing it unlocks later modules in your path."), src
    if "skip" in m:
        cur = next((s for s in ctx_steps if s.status in ("current", "recommended")), None)
        if cur:
            if cur.prerequisites:
                return (f"I wouldn't skip \"{db_resources.get(cur.resource_id).title}\" yet — it depends on "
                        f"{', '.join(cur.prerequisites)}. Finish those first, then you can move faster."), \
                       [{"type": "path_step", "id": cur.id}]
            return ("You can skip it if you already have the skills it teaches, but it currently "
                    "supports your goal, so I'd keep it."), [{"type": "path_step", "id": cur.id}]
    if "before" in m or "prerequisite" in m:
        # find referenced resource
        for s in ctx_steps:
            r = db_resources.get(s.resource_id)
            if r and r.title.lower() in m:
                if s.prerequisites:
                    names = [db_resources[p].title for p in s.prerequisites if p in db_resources]
                    return (f"Before \"{r.title}\" you should complete: {', '.join(names)}."), \
                           [{"type": "path_step", "id": s.id}]
                return f"\"{r.title}\" has no required prerequisites — you can start it now.", \
                       [{"type": "path_step", "id": s.id}]
        return "Tell me which resource you mean and I'll list what comes before it.", []
    if "today" in m or "week" in m or "focus" in m:
        cur = next((s for s in ctx_steps if s.status == "current"), None)
        if cur:
            r = db_resources.get(cur.resource_id)
            return (f"Focus on \"{r.title}\" this week — it's your current step and keeps the path moving. "
                    f"Plan about {learner.study_time_per_week} hours."), [{"type": "path_step", "id": cur.id}]
    if "on track" in m or "track" in m:
        return (f"You're working toward {learner.target_role} in {learner.timeline_months} months at "
                f"{learner.study_time_per_week} hrs/week. Keep completing your current step and you'll stay on track."), []
    if "career" in m or "job" in m:
        return (f"This project builds portfolio-ready evidence for {learner.target_role}, which is exactly what "
                f"hiring managers look for. It demonstrates the skills in your target role."), []
    # default
    cur = next((s for s in ctx_steps if s.status == "current"), None)
    if cur:
        r = db_resources.get(cur.resource_id)
        return (f"I know your goal ({learner.goal or learner.target_role}) and your current step "
                f"(\"{r.title}\"). Ask me why something is next, what to learn before it, or how a project helps your career."), \
               [{"type": "path_step", "id": cur.id}]
    return ("I don't have a generated path yet. Finish setting up your goal and profile, and I can answer "
            "questions about your recommendations."), []


async def mentor_chat(db: Session, learner_id: str, message: str) -> MentorResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    path = (
        db.query(LearningPath)
        .filter(LearningPath.learner_id == learner_id)
        .order_by(LearningPath.created_at.desc())
        .first()
    )
    ctx_steps = []
    if path:
        ctx_steps = (
            db.query(LearningStep)
            .filter(LearningStep.path_id == path.id)
            .order_by(LearningStep.order)
            .all()
        )
    ctx, sources = _context_block(db, learner)

    # store user message
    db.add(Conversation(learner_id=learner_id, role="user", message=message))

    reply = None
    if groq_available():
        prompt = (
            "Learner context:\n" + ctx + "\n\n"
            "Answer the learner's question using ONLY the context above. "
            "Do not invent courses, skills, or progress. If the answer isn't in the context, say so. "
            "Be concise and friendly.\n\nQuestion: " + message
        )
        reply = await groq_chat(SYSTEM_HEURISTIC, prompt, temperature=0.3, max_tokens=500)

    if not reply:
        reply, src = _rule_based(db, learner, message, ctx_steps)
        sources = src

    db.add(Conversation(learner_id=learner_id, role="assistant", message=reply, sources=sources))
    db.commit()
    return MentorResponse(message=reply, sources=sources)
