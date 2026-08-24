from __future__ import annotations

import json
import os
import re
from typing import Optional

from langchain_groq import ChatGroq

from ..config import GROQ_API_KEY, GROQ_MODEL

SYSTEM_HEURISTIC = (
    "You are Pathwise, an AI learning-path assistant. You help parse a learner's "
    "natural-language goal into structured fields. Always answer with strict JSON."
)

SYSTEM_MENTOR = (
    "You are Pathwise, a friendly AI learning mentor. Answer in clear natural "
    "language only — never raw JSON, code fences, or markup. Ground every answer "
    "in the learner context you are given and never invent courses, skills, or progress."
)


def groq_available() -> bool:
    return bool(GROQ_API_KEY)


def prose_or_json(text: Optional[str]) -> Optional[str]:
    """Unwrap accidental JSON wrappers around free-text answers.

    Some models occasionally obey the strict-JSON goal-parsing system prompt even
    when asked for prose, replying {"explanation": "..."} . If the payload is a
    small dict holding exactly one substantial string, return that string.
    """
    if not text:
        return text
    data = extract_json(text)
    if isinstance(data, dict) and data:
        strings = [v for v in data.values() if isinstance(v, str) and len(v.strip()) > 40]
        if len(strings) == 1 and len(data) <= 3:
            return strings[0].strip()
    return text


async def groq_chat(system: str, user: str, temperature: float = 0.2, max_tokens: int = 1500) -> Optional[str]:
    if not GROQ_API_KEY:
        return None
    try:
        llm = ChatGroq(
            model=GROQ_MODEL,
            groq_api_key=GROQ_API_KEY,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        msg = await llm.ainvoke([("system", system), ("user", user)])
        return _strip_think(msg.content)
    except Exception:
        return None


def _strip_think(text: str) -> str:
    """Remove <think>...</think> reasoning blocks emitted by some models."""
    if not text:
        return text
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<think>.*$", "", text, flags=re.DOTALL | re.IGNORECASE)
    return text.strip()


def extract_json(text: str) -> Optional[dict]:
    if not text:
        return None
    try:
        return json.loads(text)
    except Exception:
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                return None
    return None


# ---- Goal parsing ----

_DOMAINS = ["Frontend", "Backend", "Full Stack", "Mobile", "Data Analysis",
            "Data Science", "Machine Learning", "Deep Learning", "NLP",
            "Generative AI", "Cloud", "DevOps", "Security", "Blockchain"]
# goal keyword -> role (first match wins, most specific first)
_ROLES = [
    ("frontend", "Frontend Developer"), ("front-end", "Frontend Developer"),
    ("front end", "Frontend Developer"), ("web developer", "Frontend Developer"),
    ("web development", "Frontend Developer"),
    ("backend", "Backend Developer"), ("back-end", "Backend Developer"),
    ("back end", "Backend Developer"),
    ("full stack", "Full Stack Developer"), ("fullstack", "Full Stack Developer"),
    ("full-stack", "Full Stack Developer"),
    ("mobile", "Mobile Developer"), ("android", "Mobile Developer"),
    ("ios", "Mobile Developer"), ("flutter", "Mobile Developer"),
    ("swift", "Mobile Developer"), ("kotlin", "Mobile Developer"),
    ("data analy", "Data Analyst"), ("data analysis", "Data Analyst"),
    ("data scien", "Data Scientist"), ("data science", "Data Scientist"),
    ("ai/ml", "AI/ML Engineer"), ("ai engineer", "AI/ML Engineer"),
    ("ml engineer", "AI/ML Engineer"), ("machine learning", "AI/ML Engineer"),
    ("deep learning", "AI/ML Engineer"),
    ("genai", "GenAI Engineer"), ("generative", "GenAI Engineer"),
    ("llm", "GenAI Engineer"), ("rag", "GenAI Engineer"),
    ("cloud", "Cloud Engineer"), ("aws", "Cloud Engineer"),
    ("azure", "Cloud Engineer"), ("gcp", "Cloud Engineer"),
    ("devops", "DevOps Engineer"),
    ("security", "Security Engineer"), ("cyber", "Security Engineer"),
    ("blockchain", "Blockchain Developer"), ("web3", "Blockchain Developer"),
    ("nlp", "NLP Engineer"),
]

# keyword -> skill id, used to pre-fill the learner's current-skill signal
_SKILL_KEYWORDS = [
    ("python", "python"), ("java", "java"), ("c++", "cpp"), ("cpp", "cpp"),
    ("javascript", "javascript"), ("typescript", "typescript"), ("go lang", "go"),
    ("html", "html"), ("css", "css"), ("react", "react"), ("vue", "responsive_design"),
    ("node", "nodejs"), ("sql", "sql"), ("postgres", "postgres"), ("mongo", "mongodb"),
    ("docker", "docker"), ("kubernetes", "kubernetes"), ("linux", "linux"),
    ("aws", "aws"), ("azure", "azure"), ("flutter", "flutter"), ("android", "android"),
    ("swift", "swift"), ("pandas", "pandas"), ("excel", "excel"),
    ("statistics", "statistics"), ("probability", "probability"),
    ("data analysis", "data_analysis"), ("data viz", "data_viz"), ("tableau", "tableau"),
    ("machine learning", "machine_learning"), ("deep learning", "deep_learning"),
    ("computer vision", "computer_vision"), ("nlp", "nlp"), ("transformer", "transformers"),
    ("llm", "llms"), ("rag", "rag"), ("prompt", "prompt_engineering"),
    ("data engineering", "data_engineering"), ("spark", "spark"), ("kafka", "kafka"),
    ("mlops", "mlops"), ("cyber", "cybersecurity"), ("security", "cybersecurity"),
    ("blockchain", "blockchain"), ("solidity", "solidity"),
]


def heuristic_goal(goal: str) -> dict:
    g = goal.lower()
    role = None
    for k, v in _ROLES:
        if k in g:
            role = v
            break
    if role is None:
        role = "Software Engineer"

    domain = "Software"
    domain_rules = [
        ("front", "Frontend"), ("back", "Backend"), ("full stack", "Full Stack"),
        ("mobile", "Mobile"), ("android", "Mobile"), ("ios", "Mobile"), ("flutter", "Mobile"),
        ("web", "Web"), ("data analy", "Data Analysis"), ("data scien", "Data Science"),
        ("machine learning", "Machine Learning"), ("deep learning", "Deep Learning"),
        ("generative", "Generative AI"), ("genai", "Generative AI"), ("llm", "Generative AI"),
        ("rag", "Generative AI"), ("nlp", "NLP"), ("computer vision", "Computer Vision"),
        ("cloud", "Cloud"), ("devops", "DevOps"), ("security", "Security"),
        ("cyber", "Security"), ("blockchain", "Blockchain"), ("web3", "Blockchain"),
    ]
    for k, v in domain_rules:
        if k in g:
            domain = v
            break

    timeline = None
    m = re.search(r"(\d+)\s*(month|months|wk|week|weeks|year|years)", g)
    if m:
        n = int(m.group(1))
        unit = m.group(2)
        if unit.startswith("year"):
            timeline = n * 12
        elif unit.startswith("wk") or unit.startswith("week"):
            timeline = max(1, round(n / 4))
        else:
            timeline = n
    objectives = []
    if any(w in g for w in ["job", "career", "employ", "hire"]):
        objectives.append("job preparation")
    if any(w in g for w in ["project", "portfolio", "build"]):
        objectives.append("portfolio")
    if any(w in g for w in ["certif"]):
        objectives.append("certification")
    if any(w in g for w in ["academic", "study", "research", "university"]):
        objectives.append("academic learning")
    if any(w in g for w in ["explore", "learn", "understand"]):
        objectives.append("explore the field")
    detected = []
    for kw, sk in _SKILL_KEYWORDS:
        if kw in g and sk not in detected:
            detected.append(sk)
    missing = []
    if timeline is None:
        missing.append("timeline")
    missing.append("weekly study time")
    missing.append("experience level")
    if not detected:
        missing.append("current skills")
    summary = f"Goal: {role}" + (f" in {timeline} months" if timeline else "")
    return {
        "goal": goal.strip(),
        "domain": domain,
        "target_role": role,
        "timeline_months": timeline,
        "objectives": objectives or ["explore the field"],
        "detected_skills": detected,
        "missing_information": missing,
        "summary": summary,
    }


async def parse_goal(goal: str) -> dict:
    prompt = (
        "Extract structured fields from the learner goal below. "
        "Return JSON with keys: goal, domain, target_role, timeline_months (integer or null), "
        "objectives (list), detected_skills (list), missing_information (list), summary.\n\n"
        f"Goal: {goal}"
    )
    out = await groq_chat(SYSTEM_HEURISTIC, prompt, temperature=0.1)
    if out:
        parsed = extract_json(out)
        if parsed:
            parsed.setdefault("goal", goal.strip())
            parsed.setdefault("missing_information", ["weekly study time", "experience level"])
            return parsed
    return heuristic_goal(goal)
