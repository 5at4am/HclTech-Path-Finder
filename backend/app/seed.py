from __future__ import annotations

from sqlalchemy.orm import Session

from .database import Base, engine
from .models import Learner, LearningPath, LearningStep, Progress, Resource, Skill
from .ml.catalog_builder import get_catalog_resources

# Multi-domain skill ontology. The catalog (ml/catalog_builder.py) is derived
# from Data/train.csv which spans Frontend, Backend, Mobile, Cloud, Security,
# Data, ML/AI and more — these skills let every one of those domains produce a
# real, skill-linked learning path instead of collapsing to AI/ML.
SKILLS = [
    # Programming languages
    ("python", "Python", "Programming Languages"),
    ("java", "Java", "Programming Languages"),
    ("cpp", "C++", "Programming Languages"),
    ("javascript", "JavaScript", "Programming Languages"),
    ("typescript", "TypeScript", "Programming Languages"),
    ("go", "Go", "Programming Languages"),
    # Frontend
    ("html", "HTML", "Frontend"),
    ("css", "CSS", "Frontend"),
    ("react", "React", "Frontend"),
    ("responsive_design", "Responsive Design", "Frontend"),
    ("ui_ux", "UI/UX Design", "Frontend"),
    # Backend
    ("nodejs", "Node.js", "Backend"),
    ("rest_api", "REST APIs", "Backend"),
    ("authentication", "Authentication", "Backend"),
    ("spring_boot", "Spring Boot", "Backend"),
    # Databases
    ("sql", "SQL", "Databases"),
    ("postgres", "PostgreSQL", "Databases"),
    ("mongodb", "MongoDB", "Databases"),
    ("redis", "Redis", "Databases"),
    # DevOps / Cloud / Systems
    ("docker", "Docker", "DevOps"),
    ("kubernetes", "Kubernetes", "DevOps"),
    ("ci_cd", "CI/CD", "DevOps"),
    ("linux", "Linux", "Systems"),
    ("aws", "AWS", "Cloud"),
    ("azure", "Azure", "Cloud"),
    ("cloud_native", "Cloud Native", "Cloud"),
    # Mobile
    ("flutter", "Flutter", "Mobile"),
    ("react_native", "React Native", "Mobile"),
    ("swift", "Swift", "Mobile"),
    ("android", "Android", "Mobile"),
    # Data
    ("pandas", "Pandas", "Data Analysis"),
    ("data_analysis", "Data Analysis", "Data Analysis"),
    ("excel", "Excel", "Data Analysis"),
    ("statistics", "Statistics", "Statistics"),
    ("probability", "Probability", "Statistics"),
    ("data_viz", "Data Visualization", "Visualization"),
    ("tableau", "Tableau", "Visualization"),
    ("data_science", "Data Science", "Data Science"),
    ("time_series", "Time Series", "Data Science"),
    # Machine Learning / AI
    ("machine_learning", "Machine Learning", "Machine Learning"),
    ("feature_engineering", "Feature Engineering", "Machine Learning"),
    ("model_evaluation", "Model Evaluation", "Machine Learning"),
    ("deep_learning", "Deep Learning", "Deep Learning"),
    ("neural_networks", "Neural Networks", "Deep Learning"),
    ("tensorflow", "TensorFlow", "Deep Learning"),
    ("pytorch", "PyTorch", "Deep Learning"),
    ("computer_vision", "Computer Vision", "Computer Vision"),
    ("opencv", "OpenCV", "Computer Vision"),
    ("nlp", "NLP", "NLP"),
    ("transformers", "Transformers", "NLP"),
    ("llms", "LLMs", "Generative AI"),
    ("rag", "RAG", "Generative AI"),
    ("agentic_ai", "Agentic AI", "Generative AI"),
    ("prompt_engineering", "Prompt Engineering", "Generative AI"),
    ("data_engineering", "Data Engineering", "Data Engineering"),
    ("spark", "Spark", "Data Engineering"),
    ("kafka", "Kafka", "Data Engineering"),
    ("mlops", "MLOps", "MLOps"),
    ("deployment", "Deployment", "Deployment"),
    # Security / Blockchain
    ("cybersecurity", "Cybersecurity", "Security"),
    ("ethical_hacking", "Ethical Hacking", "Security"),
    ("blockchain", "Blockchain", "Blockchain"),
    ("solidity", "Solidity", "Blockchain"),
    # Portfolio (cross-domain)
    ("portfolio", "Portfolio", "Portfolio"),
]


def seed(db: Session) -> None:
    Base.metadata.create_all(bind=engine)

    if db.query(Skill).count() == 0:
        for sid, name, domain in SKILLS:
            db.add(Skill(id=sid, name=name, domain=domain))

    # Build the course catalog from the real training data (Model/solution.py's
    # source). Refresh it whenever the set of courses changes so saved paths
    # always point at resources that still exist.
    catalog = get_catalog_resources()
    catalog_ids = {c["id"] for c in catalog}
    existing_ids = {r.id for r in db.query(Resource).all()}
    if existing_ids != catalog_ids:
        db.query(LearningStep).delete()
        db.query(LearningPath).delete()
        db.query(Resource).delete()
        db.commit()
        for c in catalog:
            db.add(Resource(
                id=c["id"], title=c["title"], type=c["type"], domain=c["domain"],
                difficulty=c["difficulty"], duration_hours=c["duration_hours"], format=c["format"],
                skills_gained=c["skills_gained"], prerequisites=c["prerequisites"], phase=c["phase"],
                optional=bool(c["optional"]), rating=float(c["rating"]), description=c["description"],
            ))
        db.commit()
