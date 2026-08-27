from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy.orm import Session

from ..models import Feedback, Learner, LearningPath, LearningStep, Progress, Resource, Skill
from ..schemas import DashboardResponse
from .skill_gap_service import compute_gaps, normalize_current_skills, required_for


def _streak(db: Session, learner_id: str) -> int:
    rows = (
        db.query(Progress.updated_at)
        .filter(Progress.learner_id == learner_id)
        .order_by(Progress.updated_at)
        .all()
    )
    day_set = set()
    for (ts,) in rows:
        if ts:
            # normalize to date (handle naive/aware)
            d = ts.date() if hasattr(ts, "date") else ts
            day_set.add(d)
    if not day_set:
        return 0
    sorted_days = sorted(day_set, reverse=True)
    # consecutive streak ending at most recent active day
    streak = 1
    for i in range(1, len(sorted_days)):
        delta = (sorted_days[i - 1] - sorted_days[i]).days
        if delta == 1:
            streak += 1
        elif delta == 0:
            continue
        else:
            break
    # if most recent day is not today/yesterday, streak still counts but
    # we keep the value as computed (historical consecutive run)
    return streak


def build_dashboard(db: Session, learner_id: str) -> DashboardResponse | None:
    learner = db.get(Learner, learner_id)
    if not learner:
        return None
    path = (
        db.query(LearningPath)
        .filter(LearningPath.learner_id == learner_id)
        .order_by(LearningPath.created_at.desc())
        .first()
    )
    steps = []
    if path:
        steps = (
            db.query(LearningStep)
            .filter(LearningStep.path_id == path.id)
            .order_by(LearningStep.order)
            .all()
        )
    gaps, coverage = compute_gaps(learner)

    total = max(1, len(steps))
    done = sum(1 for s in steps if s.status == "completed")
    path_complete_pct = round(100 * done / total)

    required = required_for(learner.target_role, learner.goal)
    cur = normalize_current_skills(learner.current_skills)
    covered = sum(1 for sk, req in required.items() if int(cur.get(sk, 0)) >= req * 0.6)
    skills_covered = f"{covered}/{len(required)}"

    # continue resource = current step — pro value points
    continue_resource = None
    continue_pct = 0
    continue_remaining = 0.0
    continue_unlocks: list[str] = []
    continue_reason = ""
    current_step = next((s for s in steps if s.status == "current"), None)
    if current_step:
        r = db.get(Resource, current_step.resource_id)
        if r:
            continue_resource = _resource_out(r)
            continue_pct = current_step.completion_percentage
            continue_remaining = round(r.duration_hours * (1 - continue_pct / 100), 1)
            continue_reason = current_step.reason or ""
            # unlocks: what this step unlocks (reverse prereq map, path-scoped)
            for s in steps:
                if current_step.resource_id in (s.prerequisites or []):
                    rr = db.get(Resource, s.resource_id)
                    if rr:
                        continue_unlocks.append(rr.title)

    # next actions — short, pro, value-driven (no generic paragraph)
    next_actions = []
    if current_step and continue_resource:
        # 1. Resume line with leverage
        nxt = f"Resume: {continue_resource.title} — {continue_pct}% done · {continue_remaining}h left"
        if continue_unlocks:
            nxt += f" · unlocks {continue_unlocks[0]}"
            if len(continue_unlocks) > 1:
                nxt += f" +{len(continue_unlocks)-1}"
        next_actions.append(nxt)
    # 2. Upcoming with status hint
    upcoming = [s for s in steps if s.status in ("recommended", "locked")][:2]
    for s in upcoming:
        r = db.get(Resource, s.resource_id)
        if r:
            tag = "locked" if s.status == "locked" else "next"
            pr = f" (needs {', '.join(s.prerequisites[:1])})" if s.status == "locked" and s.prerequisites else ""
            next_actions.append(f"{tag}: {r.title} · {r.duration_hours}h · {r.difficulty}{pr}")
    # 3. Gap focus (top gap)
    if gaps:
        g = gaps[0]
        next_actions.append(f"Gap focus: {g.skill.replace('_',' ')} {g.current_level}->{g.required_level} (+{g.gap})")
    if not next_actions:
        next_actions = ["Path complete — review or add elective."]

    skill_rows = []
    for sk, req in required.items():
        lvl = int(cur.get(sk, 0))
        skill_rows.append({
            "skill": sk, "level": lvl, "required": req,
            "gap": max(0, req - lvl),
            "domain": _domain_of(db, sk),
        })
    skill_rows.sort(key=lambda x: x["gap"], reverse=True)

    priority_gaps = [
        {"skill": g.skill, "gap": g.gap, "current_level": g.current_level}
        for g in gaps[:4]
    ]

    from datetime import timedelta
    week_ago = datetime.now() - timedelta(days=7)
    hours_this_week = round(sum(
        (p.time_spent_hours or 0.0) for p in
        db.query(Progress).filter(Progress.learner_id == learner_id).all()
        if p.updated_at and p.updated_at.replace(tzinfo=None) >= week_ago
    ), 1)

    recent_feedback = [
        {"resource_id": f.resource_id, "helpful": f.helpful, "reason": f.reason}
        for f in db.query(Feedback).filter(Feedback.learner_id == learner_id)
        .order_by(Feedback.created_at.desc()).limit(3).all()
    ]

    return DashboardResponse(
        learner_id=learner_id,
        name=learner.name,
        goal=learner.goal,
        target_role=learner.target_role,
        timeline_months=learner.timeline_months,
        study_time_per_week=learner.study_time_per_week,
        interests=learner.interests or [],
        path_id=path.id if path else None,
        path_complete_pct=path_complete_pct,
        skills_covered=skills_covered,
        streak_days=_streak(db, learner_id),
        hours_this_week=hours_this_week,
        continue_resource=continue_resource,
        continue_pct=continue_pct,
        continue_remaining_hours=continue_remaining,
        continue_unlocks=continue_unlocks[:3],
        continue_reason=continue_reason,
        next_actions=next_actions[:4],
        skills=skill_rows,
        priority_gaps=priority_gaps,
        recent_feedback=recent_feedback,
    )


def _resource_out(r: Resource):
    from .recommendation_service import _resource_out as ro
    return ro(r)


def _domain_of(db: Session, skill: str) -> str:
    sk = db.get(Skill, skill)
    return sk.domain if sk else ""
