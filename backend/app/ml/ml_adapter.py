from __future__ import annotations

"""
ML adapter for Astrolabe.

This isolates the rest of the backend from the existing ML model in
``Model/solution.py``. The original ``solution.py`` is a TF-IDF +
cosine-similarity course-matching model: it vectorises course review text
and ranks the most similar courses to a query.

We reuse that exact algorithm (TfidfVectorizer + cosine_similarity +
``rank_neighbors``) but point it at our own resource catalog so that a
learner's goal/interest text is matched against real course descriptions,
producing a transparent *model relevance* score that feeds the
recommendation pipeline.
"""

import sys
from typing import Iterable, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Import the existing model's neighbour-ranking routine (no files moved).
from solution import rank_neighbors  # type: ignore

TOP_K = 20


def _resource_document(r) -> str:
    # Weight the structured, discriminative fields (title/domain/skills) more
    # heavily than the free-text reviews, which contain shared boilerplate
    # that would otherwise wash out the signal.
    skills = " ".join(r.skills_gained or [])
    parts = [
        r.title, r.title,
        r.domain, r.domain,
        skills, skills,
        r.difficulty,
        (r.description or "")[:1200],
    ]
    return " ".join(p for p in parts if p)


class RecommendationModel:
    """Wraps the solution.py TF-IDF similarity algorithm."""

    def __init__(self, resources: Iterable):
        self.resources = list(resources)
        self.ids = [r.id for r in self.resources]
        self.id_index = {rid: i for i, rid in enumerate(self.ids)}
        docs = [_resource_document(r) for r in self.resources]
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
        if docs:
            self.matrix = self.vectorizer.fit_transform(docs)
        else:
            self.matrix = None

    def score(self, profile_text: str, candidate_ids: Optional[list[str]] = None) -> dict[str, float]:
        """Return {resource_id: model_relevance 0..1} for the given query text."""
        if self.matrix is None or not self.ids:
            return {}
        q = self.vectorizer.transform([profile_text])
        if candidate_ids is None:
            pool_idx = list(range(len(self.ids)))
            pool_matrix = self.matrix
        else:
            pool_idx = [self.id_index[i] for i in candidate_ids if i in self.id_index]
            if not pool_idx:
                return {}
            pool_matrix = self.matrix[pool_idx]

        # Reuse solution.py's ranking routine to get the most similar resources.
        ranked = rank_neighbors(q, pool_matrix, pool_idx)[0]
        scores = {}
        sims = cosine_similarity(q, pool_matrix)[0]
        for idx in ranked:
            rid = self.ids[idx]
            scores[rid] = round(float(sims[idx]), 4)
        # ensure every candidate is present
        if candidate_ids is not None:
            for rid in candidate_ids:
                scores.setdefault(rid, 0.0)
        return scores

    def rank(self, profile_text: str, candidate_ids: Optional[list[str]] = None, top_k: int = TOP_K):
        scores = self.score(profile_text, candidate_ids)
        ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
        return ordered


_model: Optional["RecommendationModel"] = None


def get_model(resources: Iterable) -> "RecommendationModel":
    global _model
    if _model is None:
        _model = RecommendationModel(resources)
    return _model


def model_ready() -> bool:
    """True once a TF-IDF model has been fitted (startup rebuild or lazy get)."""
    return _model is not None


def rebuild_model(resources: Iterable) -> "RecommendationModel":
    global _model
    _model = RecommendationModel(resources)
    return _model
