"""Evidence Engine.

Wraps ``Model/solution.py`` (the original competition solution) to turn its
signature-sentence mining into the evidence backbone for every "why" the
product shows. This module NEVER modifies ``solution.py``; it imports and
reuses ``mine_course_signatures`` and ``rank_neighbors``.

Two derived artifacts are produced from ``Data/train.csv`` and committed so
lean clones (where the 56 MB CSV is gitignored) still boot with evidence:

* ``signature_bank.json``   - {course: [distinctive review phrases]}
* ``_evidence_cache.pkl``   - fitted vectorizer + per-course review centroids
"""
from __future__ import annotations

import json
import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]  # repo root (D:\CODE\HCL\PathFinder)
DATA_FILE = ROOT / "Data" / "train.csv"
SIG_CACHE = BASE / "signature_bank.json"
MODEL_CACHE = BASE / "_evidence_cache.pkl"
CATALOG_CACHE = BASE / "_catalog_cache.json"

# Domain affinity map: which domains are considered "related" for peer course suggestions
DOMAIN_AFFINITY: dict[str, set[str]] = {
    "Frontend": {"Frontend", "Full Stack", "Mobile", "Programming Languages"},
    "Backend": {"Backend", "Full Stack", "Databases", "DevOps", "Cloud", "Programming Languages"},
    "Full Stack": {"Frontend", "Backend", "Full Stack", "Databases", "DevOps", "Programming Languages"},
    "Mobile": {"Mobile", "Frontend", "Programming Languages"},
    "DevOps": {"DevOps", "Cloud", "Systems", "Backend", "MLOps", "Data Engineering"},
    "Cloud": {"Cloud", "DevOps", "Backend", "Data Engineering"},
    "Systems": {"Systems", "DevOps", "Programming Languages"},
    "Databases": {"Databases", "Backend", "Data Engineering", "Data Analysis", "Data Science"},
    "Data Engineering": {"Data Engineering", "Databases", "Cloud", "DevOps", "Data Science", "Data Analysis"},
    "Data Science": {"Data Science", "Data Engineering", "Machine Learning", "Statistics", "Data Analysis", "Visualization"},
    "Data Analysis": {"Data Analysis", "Data Science", "Visualization", "Statistics", "Databases"},
    "Machine Learning": {"Machine Learning", "Deep Learning", "Data Science", "MLOps", "NLP", "Computer Vision", "Generative AI"},
    "Deep Learning": {"Deep Learning", "Machine Learning", "Computer Vision", "NLP", "Generative AI", "MLOps"},
    "MLOps": {"MLOps", "Machine Learning", "Deep Learning", "DevOps", "Data Engineering", "Cloud"},
    "NLP": {"NLP", "Machine Learning", "Deep Learning", "Generative AI", "Data Science"},
    "Computer Vision": {"Computer Vision", "Deep Learning", "Machine Learning", "Generative AI"},
    "Generative AI": {"Generative AI", "Machine Learning", "Deep Learning", "NLP", "Data Science"},
    "Statistics": {"Statistics", "Data Science", "Data Analysis", "Machine Learning"},
    "Visualization": {"Visualization", "Data Analysis", "Data Science", "Frontend"},
    "Security": {"Security", "DevOps", "Backend", "Systems", "Blockchain"},
    "Blockchain": {"Blockchain", "Security", "Backend", "Programming Languages"},
    "Programming Languages": {"Programming Languages", "Frontend", "Backend", "Mobile", "Data Science", "Machine Learning"},
}


def _model_dir():
    for cand in (
        ROOT / "Model",
        BASE.parents[1] / "Model",
        BASE / "Model",
    ):
        if (cand / "solution.py").exists():
            return cand
    return ROOT / "Model"


_COURSE_DOMAIN_CACHE: dict[str, str] | None = None


def _load_course_domains() -> dict[str, str]:
    """Load course->domain mapping from the catalog cache."""
    global _COURSE_DOMAIN_CACHE
    if _COURSE_DOMAIN_CACHE is not None:
        return _COURSE_DOMAIN_CACHE
    try:
        raw = json.loads(CATALOG_CACHE.read_text(encoding="utf-8"))
        catalog = raw.get("catalog", [])
        mapping = {c["title"]: c["domain"] for c in catalog if c.get("title") and c.get("domain")}
        _COURSE_DOMAIN_CACHE = mapping
        return mapping
    except (OSError, ValueError, KeyError, TypeError):
        return {}


_MDIR = _model_dir()
if str(_MDIR) not in sys.path:
    sys.path.insert(0, str(_MDIR))

from solution import (  # noqa: E402
    mine_course_signatures,
    rank_neighbors,
    tokenize_sentences,
)

SIG_PER_COURSE = 12  # how many distinctive phrases we surface per course
VECTORIZER_KWARGS = dict(
    stop_words="english",
    ngram_range=(1, 2),
    min_df=5,
    max_features=50000,
    sublinear_tf=True,
)


def _clean(phrase: str) -> str:
    p = phrase.strip().strip('"').strip("'")
    p = p[0].upper() + p[1:] if p else p
    return p


def build_evidence(force: bool = False) -> None:
    """Mine signatures + fit the evidence space from the full review corpus."""
    if not force and SIG_CACHE.exists() and MODEL_CACHE.exists():
        print("[evidence] caches present, skipping build")
        return
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"train.csv not found at {DATA_FILE}")

    print(f"[evidence] reading {DATA_FILE} ...")
    df = pd.read_csv(DATA_FILE)
    reviews = df["Reviews"].astype(str).tolist()
    courses = df["Course"].astype(str).tolist()
    print(f"[evidence] {len(reviews)} reviews, {len(set(courses))} courses")

    print("[evidence] mining course signatures ...")
    mined = mine_course_signatures(reviews, courses)  # {sentence: course}
    by_course: dict[str, list[str]] = {}
    for sent, course in mined.items():
        by_course.setdefault(course, []).append(sent)
    signatures: dict[str, list[str]] = {}
    for course, sents in by_course.items():
        cleaned = [
            _clean(s)
            for s in sents
            if len(_clean(s)) >= 12 and len(_clean(s).split()) >= 3
        ]
        name = course.lower()
        content = [s for s in cleaned if name not in s.lower()]
        namey = [s for s in cleaned if name in s.lower()]
        # Prefer substantive sentences (no course name, more words first).
        content.sort(key=lambda s: (-len(s.split()), len(s)))
        signatures[course] = (content + namey)[:SIG_PER_COURSE]

    print("[evidence] fitting evidence vectorizer ...")
    vectorizer = TfidfVectorizer(**VECTORIZER_KWARGS)
    X = vectorizer.fit_transform(reviews)

    course_names = sorted(set(courses))
    print(f"[evidence] building {len(course_names)} course centroids ...")
    by_course = {}
    for i, c in enumerate(courses):
        by_course.setdefault(c, []).append(i)
    rows = []
    for c in course_names:
        idx = by_course[c]
        rows.append(sparse.csr_matrix(X[idx].mean(axis=0)))
    centroids = sparse.vstack(rows, format="csr")

    SIG_CACHE.write_text(json.dumps(signatures, ensure_ascii=False, indent=1))
    with MODEL_CACHE.open("wb") as fh:
        pickle.dump(
            {
                "vectorizer": vectorizer,
                "course_names": course_names,
                "centroids": centroids,
                "csv_size": DATA_FILE.stat().st_size,
                "csv_mtime": DATA_FILE.stat().st_mtime_ns,
            },
            fh,
        )
    print("[evidence] built signature_bank.json + _evidence_cache.pkl")


_ENGINE: dict | None = None


def get_engine() -> dict | None:
    """Lazily load (or build) the evidence engine. Returns None if unavailable."""
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    if not (SIG_CACHE.exists() and MODEL_CACHE.exists()):
        if DATA_FILE.exists():
            build_evidence()
        else:
            print("[evidence] no train.csv and no caches; evidence disabled")
            return None

    signatures = json.loads(SIG_CACHE.read_text(encoding="utf-8"))
    with MODEL_CACHE.open("rb") as fh:
        blob = pickle.load(fh)
    _ENGINE = {
        "signatures": signatures,
        "vectorizer": blob["vectorizer"],
        "course_names": blob["course_names"],
        "centroids": blob["centroids"],
    }
    return _ENGINE


def engine_ready() -> bool:
    return get_engine() is not None


def explain(query_doc: str, course_name: str, k: int = 5):
    """Return an Evidence object grounding why ``course_name`` fits ``query_doc``."""
    from app.schemas import Evidence

    eng = get_engine()
    if eng is None:
        return Evidence(source="evidence_engine")

    sigs = eng["signatures"].get(course_name, [])
    sig_set = set(sigs)
    query_sentences = tokenize_sentences(query_doc)
    matched = [s for s in query_sentences if s in sig_set][:8]

    qv = eng["vectorizer"].transform([str(query_doc)])
    try:
        cidx = eng["course_names"].index(course_name)
    except ValueError:
        cidx = -1

    similarity = 0.0
    peer_courses: list[str] = []
    if cidx >= 0:
        from sklearn.metrics.pairwise import cosine_similarity

        target_vec = eng["centroids"].getrow(cidx)
        similarity = float(cosine_similarity(qv, target_vec)[0, 0])
        ranked = rank_neighbors(
            qv, eng["centroids"], list(range(len(eng["course_names"])))
        )[0]
        all_peers = [
            eng["course_names"][i] for i in ranked if i != cidx
        ]

        course_domains = _load_course_domains()
        target_domain = course_domains.get(course_name, "")
        if target_domain:
            allowed_domains = DOMAIN_AFFINITY.get(target_domain, {target_domain})
            peer_courses = [
                p for p in all_peers
                if course_domains.get(p, "") in allowed_domains
            ][:k]
        else:
            peer_courses = all_peers[:k]

    return Evidence(
        course_signatures=sigs[:8],
        matched_signatures=matched,
        similarity=max(0.0, similarity),
        peer_courses=peer_courses,
        source="evidence_engine",
    )
