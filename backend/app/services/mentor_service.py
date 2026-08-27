from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Conversation, Learner, LearningPath, LearningStep, Resource
from ..schemas import MentorResponse
from .groq_service import SYSTEM_MENTOR, groq_chat, groq_available, prose_or_json
from .skill_gap_service import compute_gaps
from .profile_service import _to_response
from ..ml.ml_adapter import get_model


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
    gaps, coverage = compute_gaps(learner)
    # richer context for pro short answers: include progress, streak, remaining
    total = len(steps) if steps else 0
    done = sum(1 for s in steps if s.status == "completed")
    pct = round(100 * done / max(1, total)) if total else 0
    cur = next((s for s in steps if s.status == "current"), None)
    cur_title = ""
    cur_unlocks: list[str] = []
    if cur:
        # what cur unlocks
        for s in steps:
            if cur.resource_id in (s.prerequisites or []):
                rr = db.get(Resource, s.resource_id)
                if rr:
                    cur_unlocks.append(rr.title)
        r = db.get(Resource, cur.resource_id)
        cur_title = r.title if r else cur.resource_id
    lines = [f"Learner goal: {learner.goal}", f"Target role: {learner.target_role}",
             f"Timeline: {learner.timeline_months} months", f"Study time: {learner.study_time_per_week} hrs/week",
             f"Experience: {learner.experience_level} | Progress: {pct}% ({done}/{total}) | Coverage: {coverage}%"]
    if cur_title:
        lines.append(f"Current step: {cur_title} | unlocks: {', '.join(cur_unlocks[:2]) or 'none'} | remaining: {cur.estimated_hours}h")
    lines.append("Current skills: " + ", ".join(f"{k} {v}%" for k, v in (learner.current_skills or {}).items())[:180])
    lines.append("Priority gaps: " + ", ".join(f"{g.skill.replace('_',' ')} {g.current_level}->{g.required_level}(+{g.gap})" for g in gaps[:3]))
    if steps:
        lines.append("Learning path (order | status | prereqs | skills):")
        for s in steps[:10]:
            r = db.get(Resource, s.resource_id)
            pre = ", ".join(s.prerequisites) if s.prerequisites else "none"
            lines.append(f"- {r.title if r else s.resource_id} | {s.status} | prereqs=[{pre}] | skills={', '.join(s.skills_gained[:3])} | {s.estimated_hours}h")
            sources.append({"type": "path_step", "id": s.id, "label": r.title if r else s.resource_id})
    # recent conversation for follow-ups
    try:
        recent = db.query(Conversation).filter(Conversation.learner_id==learner.id).order_by(Conversation.created_at.desc()).limit(4).all()
        if recent:
            recent.reverse()
            lines.append("Recent chat:")
            for c in recent[-4:]:
                lines.append(f"{c.role}: {c.message[:120]}")
    except Exception:
        pass
    return "\n".join(lines), sources


def _rule_based(db: Session, learner: Learner, message: str, ctx_steps) -> tuple[str, list[dict]]:
    m = message.lower()
    db_resources = {r.id: r for r in db.query(Resource).all()}
    src = []
    if "why" in m and ("next" in m or "this" in m or "course" in m):
        cur = next((s for s in ctx_steps if s.status in ("current", "recommended")), None)
        if cur:
            r = db_resources.get(cur.resource_id)
            src = [{"type": "path_step", "id": cur.id, "label": r.title if r else cur.resource_id}]
            unlocks = [db_resources[p].title for p in []]
            # collect unlocks
            for s in ctx_steps:
                if cur.resource_id in (s.prerequisites or []):
                    rr = db_resources.get(s.resource_id)
                    if rr: unlocks.append(rr.title)
            return (
                f"• Next: {r.title} — closes {', '.join(cur.skills_gained[:2]).replace('_',' ')} gap, prereqs done\n"
                f"• Cost: {cur.estimated_hours}h · {cur.phase} · ~{max(1,round(cur.estimated_hours/max(1,learner.study_time_per_week)))} week(s) at {learner.study_time_per_week}h/week\n"
                f"• Unlocks: {', '.join(unlocks[:2]) or 'next phase'} — keep momentum",
                src)
    if "skip" in m:
        cur = next((s for s in ctx_steps if s.status in ("current", "recommended")), None)
        if cur:
            if cur.prerequisites:
                return (f"• Don't skip: {db_resources.get(cur.resource_id).title} needs {', '.join(cur.prerequisites[:1])}\n• Finish prereq first — then skip is safe\n• Tip: mark already-known to fast-track", [{"type": "path_step", "id": cur.id}])
            return ("• Can skip if skills done — else keep it\n• Check: does it close your top gap?\n• Use Already know to auto-skip", [{"type": "path_step", "id": cur.id}])
    if "before" in m or "prerequisite" in m:
        for s in ctx_steps:
            r = db_resources.get(s.resource_id)
            if r and r.title.lower() in m:
                if s.prerequisites:
                    names = [db_resources[p].title for p in s.prerequisites if p in db_resources]
                    return (f"• Before {r.title}: {', '.join(names)}\n• Complete them — then this unlocks\n• Est: {s.estimated_hours}h after prereqs", [{"type": "path_step", "id": s.id, "label": r.title}])
                return f"• {r.title}: no prereqs — start now\n• {s.estimated_hours}h · {s.phase}\n• Direct to goal", [{"type": "path_step", "id": s.id, "label": r.title}]
        return "• Batao kaunsa course — I'll list prereqs\n• e.g. 'prereq for React?'\n• Checks path DAG", []
    # --- Hinglish / today intent (aaj kya karna hai / what to do today) ---
    if any(w in m for w in ["aaj", "krna", "karna", "kya karu", "kya kru", "आज"]) or "today" in m or "week" in m or "focus" in m:
        # reuse Focus but triggered by Hinglish as well
        # only treat as today-intent if message is short question about doing/focus
        if any(q in m for q in ["kya", "krna", "karna", "kru", "karu", "aaj", "today", "week", "focus", "abhi"]):
            cur = next((s for s in ctx_steps if s.status == "current"), None)
            if cur:
                r = db_resources.get(cur.resource_id)
                return (f"• Focus: {r.title} — your current step\n• Plan: {cur.estimated_hours}h this week (~{learner.study_time_per_week}h/week)\n• Next: finish to unlock +2 downstream", [{"type": "path_step", "id": cur.id, "label": r.title}])
    if "on track" in m or "track" in m:
        return (f"• Target: {learner.target_role} in {learner.timeline_months} mo @ {learner.study_time_per_week}h/week\n• Progress: finish current step to stay on track\n• Tip: use What-if to test pace", [])
    if "career" in m or "job" in m:
        return (f"• Project proves {learner.target_role} skills — portfolio ready\n• Shows: {', '.join(cur.skills_gained[:2]).replace('_',' ') if (cur:=next((s for s in ctx_steps if s.status=='current'),None)) else 'core skills'}\n• Hire signal: shipped > certificate", [])

    # --- dont-know / what-is skill gap explanation (e.g. i dont know ML) ---
    dont_triggers = ["dont know", "don t know", "do not know", "not know", "nahi aata", "nahi pata", "samajh nahi", "what is", "kya hai", "kya hota", "explain", "sikhna hai"]
    if any(t in m for t in dont_triggers):
        # try to detect which skill/domain the user means
        skill_map = [
            ("machine learning", "machine_learning"), ("ml", "ml"), ("deep learning", "deep_learning"),
            ("python", "python"), ("java", "java"), ("react", "react"), ("javascript", "javascript"),
            ("statistics", "statistics"), ("data science", "data_science"), ("ai", "ai"), ("sql", "sql"),
        ]
        detected = None
        for kw, sid in skill_map:
            if kw in m:
                detected = (kw, sid)
                break
        # fallback: use top gap if no explicit skill
        from .skill_gap_service import compute_gaps as _cg
        try:
            gaps2, _ = _cg(learner)
            top_gap = gaps2[0] if gaps2 else None
        except Exception:
            top_gap = None
        if detected:
            kw, _sid = detected
            # find a path step that teaches this skill
            target_step = None
            for s in ctx_steps:
                if any(kw in (sg.lower()) for sg in (s.skills_gained or [])):
                    target_step = s; break
            if not target_step:
                for s in ctx_steps:
                    r = db_resources.get(s.resource_id)
                    if r and kw in r.title.lower():
                        target_step = s; break
            cur = next((s for s in ctx_steps if s.status == "current"), None)
            cur_title = db_resources.get(cur.resource_id).title if cur and db_resources.get(cur.resource_id) else "current step"
            if target_step:
                rt = db_resources.get(target_step.resource_id)
                # map prereq ids to titles
                if target_step.prerequisites:
                    pre_titles = [db_resources[pid].title for pid in target_step.prerequisites[:1] if pid in db_resources]
                    pre = ", ".join(pre_titles) if pre_titles else target_step.prerequisites[0]
                else:
                    pre = "none — start after Python"
                if top_gap and top_gap.skill.lower() in [sg.lower() for sg in (target_step.skills_gained or [])]:
                    gap_txt = f"+{top_gap.gap} ({top_gap.skill.replace('_',' ')})"
                else:
                    gap_txt = "your track"
                return (
                    f"• {kw.title()} gap {gap_txt} — taught in '{rt.title}' ({target_step.phase}, {target_step.estimated_hours}h)\n"
                    f"• Pehle: {cur_title} karo — prereq [{pre}] ke baad '{rt.title}' unlock hoga\n"
                    f"• Tip: Python done -> ML unlock, 2 steps in ~{max(1,round((cur.estimated_hours+target_step.estimated_hours)/max(1,learner.study_time_per_week)))} week(s)",
                    [{"type": "path_step", "id": target_step.id, "label": rt.title}]
                )
            # no step found but skill known
            return (
                f"• {kw.title()} abhi gap me hai — current {cur_title} pe focus rakho\n"
                f"• Iske baad {kw.title()} wala step ayega (prereq: Python foundations)\n"
                f"• Ask: 'prereq for {kw.title()}?' for exact DAG",
                []
            )
        # generic dont-know without skill name
        cur = next((s for s in ctx_steps if s.status == "current"), None)
        r = db_resources.get(cur.resource_id) if cur else None
        top = f"{top_gap.skill.replace('_',' ')} (+{top_gap.gap})" if top_gap else "your top gap"
        return (
            f"• Samjha — start with '{r.title if r else 'current step'}' ({cur.estimated_hours if cur else '?'}h, {cur.phase if cur else 'Foundations'})\n"
            f"• Yeh {top} ko close karega — phir agla step unlock hoga\n"
            f"• Doubt ho to pucho: 'why this step next?' or 'prereq for ML?'",
            [{"type": "path_step", "id": cur.id, "label": r.title}] if cur and r else []
        )

    cur = next((s for s in ctx_steps if s.status == "current"), None)
    if cur:
        r = db_resources.get(cur.resource_id)
        return (f"• Goal: {learner.target_role} | Current: {r.title}\n• Ask: why next? / prereq for X? / skip?\n• Short bullets, grounded in path", [{"type": "path_step", "id": cur.id, "label": r.title}])
    return ("• No path yet — set goal + profile first\n• Then ask: why this step?\n• I'll ground in real catalog", [])


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

    # ML RAG: fetch top 3 catalog resources matching the question via TF-IDF
    # so mentor is grounded in real course descriptions (Aman's hallucination fear)
    try:
        resources = db.query(Resource).all()
        model = get_model(resources)
        q_scores = model.score(message)
        if q_scores:
            top = sorted(q_scores.items(), key=lambda kv: kv[1], reverse=True)[:3]
            rag_lines = []
            for rid, sc in top:
                if sc < 0.05:
                    continue
                r = next((x for x in resources if x.id == rid), None)
                if r:
                    rag_lines.append(f"- {r.title} ({r.domain}, {r.difficulty}, {sc:.2f}): {(r.description or '')[:180]}")
                    sources.append({"type": "catalog_match", "id": rid, "score": round(float(sc),3)})
            if rag_lines:
                ctx += "\n\nRelevant catalog matches for the question (TF-IDF cosine):\n" + "\n".join(rag_lines)
    except Exception:
        pass

    # store user message
    db.add(Conversation(learner_id=learner_id, role="user", message=message))

    # Groq is PRIMARY — rule-based is fallback only if Groq fails/empty (not keyword-conditional)
    reply = None
    groq_tried = False
    if groq_available():
        groq_tried = True
        prompt = (
            "Learner context:\n" + ctx + "\n\n"
            "Answer the learner's question using ONLY the context above (including catalog matches if present). "
            "Do not invent courses, skills, or progress. If the answer isn't in the context, say so. "
            "Be concise and friendly, Hinglish is okay if user uses it.\n\nQuestion: " + message
        )
        reply = prose_or_json(await groq_chat(SYSTEM_MENTOR, prompt, temperature=0.3, max_tokens=2500))

    if not reply:
        # fallback: deterministic rule-based (offline / Groq error) — also logs
        if groq_tried:
            import logging
            logging.getLogger("padhai.mentor").info("groq fallback to rule-based for: %r", message[:80])
        reply, src = _rule_based(db, learner, message, ctx_steps)
        sources = src

    db.add(Conversation(learner_id=learner_id, role="assistant", message=reply, sources=sources))
    db.commit()
    return MentorResponse(message=reply, sources=sources)
