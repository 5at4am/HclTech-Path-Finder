from __future__ import annotations

"""
Build the Resource catalog from the real course data in ``Data/train.csv``.

``Model/solution.py`` is a TF-IDF + cosine-similarity course matcher trained on
this same file. By turning every distinct course in the data into a Resource
(whose description is the aggregated learner reviews), we give the ML model a
rich, *diverse* corpus to match against — so a "Frontend" goal finally returns
frontend courses instead of the old ML-only catalog.

Run ``get_catalog_resources()`` to get a list of Resource-shaped dicts.
"""

import csv
import json
import re
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parents[3] / "Data" / "train.csv"
CACHE_FILE = Path(__file__).resolve().parent / "_catalog_cache.json"

DIFF_ORDER = {"beginner": 0, "intermediate": 1, "advanced": 2}
PHASE_BY_DIFF = {"beginner": "Foundations", "intermediate": "Core", "advanced": "Advanced"}


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


# Ordered (specific -> general) substring rules. First match wins.
_DOMAIN_RULES: list[tuple[tuple[str, ...], str]] = [
    (("html", "css"), "Frontend"),
    (("responsive web",), "Frontend"),
    (("react native",), "Mobile"),
    (("react.js", "react js"), "Frontend"),
    (("vue.js", "vue js"), "Frontend"),
    (("angular",), "Frontend"),
    (("typescript",), "Frontend"),
    (("javascript fundamentals", "modern javascript", "es6"), "Frontend"),
    (("javascript full stack",), "Full Stack"),
    (("node.js", "node js"), "Backend"),
    (("flutter",), "Mobile"),
    (("ios app", "swift"), "Mobile"),
    (("android app",), "Mobile"),
    (("smart contract", "solidity", "blockchain"), "Blockchain"),
    (("deep learning", "neural network", "tensorflow", "pytorch", "transfer learning"), "Deep Learning"),
    (("computer vision", "opencv"), "Computer Vision"),
    (("natural language", "nlp"), "NLP"),
    (("generative ai", "prompt engineering"), "Generative AI"),
    (("reinforcement learning",), "Machine Learning"),
    (("machine learning", "supervised", "unsupervised", "feature engineering"), "Machine Learning"),
    (("mlops",), "MLOps"),
    (("data engineering", "etl", "kafka", "spark", "data warehouse", "warehouse design"), "Data Engineering"),
    (("exploratory data", "data analysis", "pandas", "excel for data"), "Data Analysis"),
    (("time series",), "Data Science"),
    (("data science", "python for data"), "Data Science"),
    (("data visualization", "matplotlib", "tableau", "power bi"), "Visualization"),
    (("statistic", "hypothesis", "probability", "bayesian"), "Statistics"),
    (("sql", "postgres", "mysql", "mongodb", "redis", "database"), "Databases"),
    (("django", "flask", "spring boot", "graphql", "rest api", "go language",
      "java programming", "advanced java", "backend"), "Backend"),
    (("docker", "kubernetes", "k8s", "ci cd", "devops", "git and github"), "DevOps"),
    (("aws", "azure", "gcp", "google cloud", "cloud practitioner", "solutions architect"), "Cloud"),
    (("linux command",), "Systems"),
    (("embedded", "iot", "raspberry"), "Systems"),
    (("ethical hacking", "cybersecurity"), "Security"),
    (("calculus", "linear algebra"), "Mathematics"),
    (("python",), "Programming Languages"),
    (("c plus plus", "cpp"), "Programming Languages"),
    (("java",), "Programming Languages"),
]


def _classify(name: str) -> str:
    n = name.lower()
    for keys, domain in _DOMAIN_RULES:
        if any(k in n for k in keys):
            return domain
    return "General"


# Maps each catalog domain to the skill ids defined in seed.py so that a
# course's skills_gained actually intersect the learner's gap analysis.
DOMAIN_SKILLS: dict[str, list[str]] = {
    "Frontend": ["html", "css", "javascript", "react", "responsive_design", "ui_ux"],
    "Backend": ["nodejs", "rest_api", "sql", "postgres", "authentication", "spring_boot"],
    "Full Stack": ["html", "css", "javascript", "react", "nodejs", "rest_api", "sql"],
    "Machine Learning": ["machine_learning", "feature_engineering", "model_evaluation", "python", "statistics"],
    "Deep Learning": ["deep_learning", "neural_networks", "tensorflow", "pytorch", "python"],
    "Computer Vision": ["computer_vision", "opencv", "deep_learning", "python"],
    "NLP": ["nlp", "transformers", "python"],
    "Generative AI": ["llms", "rag", "agentic_ai", "prompt_engineering", "python"],
    "MLOps": ["mlops", "deployment", "docker", "kubernetes"],
    "Data Engineering": ["data_engineering", "spark", "kafka", "sql", "python"],
    "Data Science": ["data_science", "python", "statistics", "pandas", "machine_learning"],
    "Data Analysis": ["data_analysis", "pandas", "excel", "sql", "statistics"],
    "Visualization": ["data_viz", "tableau", "pandas"],
    "Statistics": ["statistics", "probability", "python"],
    "Databases": ["sql", "postgres", "mongodb", "redis"],
    "DevOps": ["docker", "kubernetes", "ci_cd", "linux"],
    "Cloud": ["aws", "azure", "cloud_native", "deployment"],
    "Systems": ["linux", "cpp"],
    "Mobile": ["flutter", "react_native", "swift", "android", "javascript"],
    "Blockchain": ["blockchain", "solidity", "javascript"],
    "Security": ["cybersecurity", "ethical_hacking", "linux"],
    "Programming Languages": ["python", "java", "cpp", "javascript", "typescript", "go"],
}


def _difficulty(name: str) -> str:
    n = name.lower()
    if "advanced" in n:
        return "advanced"
    if any(w in n for w in ("for absolute beginners", "for beginners", "fundamentals", "basics", "essentials")):
        return "beginner"
    return "intermediate"


# Curated prerequisite edges (by resource id). Builds a real learning DAG so
# status (locked/recommended), unlocks, and topological ordering are meaningful.
PREREQS: dict[str, list[str]] = {
    "modern_javascript_es6_plus": ["javascript_fundamentals"],
    "typescript_for_developers": ["javascript_fundamentals"],
    "react_js_development": ["javascript_fundamentals", "html_and_css_for_beginners"],
    "vue_js_for_beginners": ["javascript_fundamentals", "html_and_css_for_beginners"],
    "angular_framework_essentials": ["typescript_for_developers", "html_and_css_for_beginners"],
    "responsive_web_design": ["html_and_css_for_beginners"],
    "advanced_java_and_spring_boot": ["java_programming_basics"],
    "node_js_backend_development": ["javascript_fundamentals"],
    "graphql_api_development": ["node_js_backend_development"],
    "django_web_framework": ["python_for_absolute_beginners"],
    "flask_api_development": ["python_for_absolute_beginners"],
    "python_oop_concepts": ["python_for_absolute_beginners"],
    "advanced_python_development": ["python_oop_concepts"],
    "python_programming_masterclass": ["python_for_absolute_beginners"],
    "python_automation_and_scripting": ["python_for_absolute_beginners"],
    "python_for_data_science": ["python_for_absolute_beginners"],
    "advanced_sql_and_query_optimization": ["sql_for_beginners"],
    "postgresql_database_design": ["sql_for_beginners"],
    "mongodb_for_developers": ["sql_for_beginners"],
    "redis_caching_strategies": ["sql_for_beginners"],
    "machine_learning_fundamentals": ["python_for_absolute_beginners"],
    "supervised_learning_algorithms": ["machine_learning_fundamentals"],
    "unsupervised_learning_techniques": ["machine_learning_fundamentals"],
    "feature_engineering_for_ml": ["machine_learning_fundamentals"],
    "reinforcement_learning_basics": ["machine_learning_fundamentals"],
    "deep_learning_with_tensorflow": ["machine_learning_fundamentals"],
    "deep_learning_with_pytorch": ["machine_learning_fundamentals"],
    "advanced_neural_networks": ["deep_learning_with_tensorflow", "deep_learning_with_pytorch"],
    "transfer_learning_and_fine_tuning": ["deep_learning_with_pytorch"],
    "computer_vision_with_opencv": ["deep_learning_with_pytorch"],
    "natural_language_processing": ["machine_learning_fundamentals"],
    "generative_ai_and_prompt_engineering": ["machine_learning_fundamentals"],
    "mlops_and_model_deployment": ["machine_learning_fundamentals"],
    "data_analysis_with_pandas": ["python_for_absolute_beginners"],
    "exploratory_data_analysis": ["data_analysis_with_pandas"],
    "statistical_analysis_with_r": ["probability_and_statistics"],
    "bayesian_statistics": ["probability_and_statistics"],
    "hypothesis_testing_in_practice": ["probability_and_statistics"],
    "time_series_analysis": ["python_for_data_science"],
    "data_engineering_with_apache_spark": ["python_for_absolute_beginners"],
    "etl_pipeline_development": ["python_for_absolute_beginners"],
    "apache_kafka_for_real_time_data": ["data_engineering_with_apache_spark"],
    "data_warehouse_design": ["sql_for_beginners"],
    "docker_and_containerization": ["linux_command_line_essentials"],
    "kubernetes_orchestration": ["docker_and_containerization"],
    "ci_cd_pipeline_setup": ["docker_and_containerization"],
    "devops_practices_and_tools": ["docker_and_containerization"],
    "aws_solutions_architect": ["aws_cloud_practitioner"],
    "react_native_mobile_development": ["javascript_fundamentals"],
    "iot_with_raspberry_pi": ["embedded_systems_programming"],
    "tableau_for_business_analytics": ["excel_for_data_analysis"],
    "power_bi_dashboard_creation": ["excel_for_data_analysis"],
    "data_visualization_with_matplotlib": ["python_for_data_science"],
}


def _load_courses() -> dict[str, list[str]]:
    """Return {course_name: [review texts]} from the training data."""
    reviews: dict[str, list[str]] = {}
    with open(DATA_FILE, encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            course = (row.get("Course") or "").strip()
            text = (row.get("Reviews") or "").strip()
            if course and text:
                reviews.setdefault(course, []).append(text)
    return reviews


def get_catalog_resources() -> list[dict]:
    """Build Resource-shaped dicts from the distinct courses in the data.

    The result is cached on disk keyed by the source CSV's size+mtime, so
    server startups after the first one skip the multi-minute CSV parse.
    """
    stat = DATA_FILE.stat()
    key = {"size": stat.st_size, "mtime": int(stat.st_mtime)}
    try:
        raw = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        if raw.get("source") == key:
            return raw["catalog"]
    except (OSError, ValueError, KeyError, TypeError):
        pass

    catalog = _build_catalog()

    try:
        CACHE_FILE.write_text(
            json.dumps({"source": key, "catalog": catalog}), encoding="utf-8"
        )
    except OSError:
        pass
    return catalog


def _build_catalog() -> list[dict]:
    courses = _load_courses()
    catalog: list[dict] = []
    by_domain: dict[str, list[str]] = {}
    for name, texts in courses.items():
        # Deduplicate and cap the description size for a meaningful TF-IDF corpus.
        seen: list[str] = []
        for t in texts:
            if t not in seen:
                seen.append(t)
            if len(seen) >= 8:
                break
        description = " ".join(seen)[:3000]

        difficulty = _difficulty(name)
        domain = _classify(name)
        rid = _slug(name)
        by_domain.setdefault(domain, []).append(rid)
        catalog.append({
            "id": rid,
            "title": name,
            "type": "course",
            "domain": domain,
            "difficulty": difficulty,
            "duration_hours": {"beginner": 10, "intermediate": 15, "advanced": 20}[difficulty],
            "format": "video",
            "description": description,
            "skills_gained": DOMAIN_SKILLS.get(domain, [domain]),
            "prerequisites": PREREQS.get(rid, []),
            "phase": PHASE_BY_DIFF[difficulty],
            "optional": False,
            "rating": 4.6,
        })

    # Give every domain a hands-on project + an assessment so generated paths
    # are not only video courses. Projects depend on that domain's courses.
    for domain, course_ids in by_domain.items():
        skills = DOMAIN_SKILLS.get(domain, [domain])
        dslug = _slug(domain)
        prereqs = course_ids[: min(3, len(course_ids))]
        catalog.append({
            "id": f"{dslug}_project",
            "title": f"Capstone Project: Build with {domain}",
            "type": "project",
            "domain": domain,
            "difficulty": "advanced",
            "duration_hours": 25,
            "format": "hands-on",
            "description": f"Apply your {domain} skills to ship a portfolio-grade project "
                           f"that demonstrates {', '.join(skills[:4])}.",
            "skills_gained": skills,
            "prerequisites": prereqs,
            "phase": "Advanced",
            "optional": False,
            "rating": 4.8,
        })
        catalog.append({
            "id": f"{dslug}_assessment",
            "title": f"{domain} Skills Assessment",
            "type": "assessment",
            "domain": domain,
            "difficulty": "intermediate",
            "duration_hours": 3,
            "format": "interactive",
            "description": f"Validate your {domain} fundamentals before progressing.",
            "skills_gained": skills,
            "prerequisites": [],
            "phase": "Core",
            "optional": True,
            "rating": 4.5,
        })
    return catalog
