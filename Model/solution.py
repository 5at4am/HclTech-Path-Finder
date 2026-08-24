import re
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "Data"

TRAIN_FILE = DATA_DIR / "train.csv"
TEST_FILE = DATA_DIR / "test.csv"
OUTPUT_FILE = BASE_DIR / "submission.csv"

TOP_K = 10
NGRAMS = (1, 3)

SENT_BOUNDARY = re.compile(r"(?<=[.!?])\s+")
COURSE_SLOT = re.compile(r"\b(?:this|the)\s+(?:full\s+)?(?:course|program|learning\s+path)\b",
                         re.IGNORECASE)


def tokenize_sentences(text):
    return [s.strip() for s in SENT_BOUNDARY.split(str(text)) if s.strip()]


def mine_course_signatures(reviews, labels):
    """Sentences that occur under exactly one course act as that course's fingerprint."""
    sentence_to_courses = defaultdict(set)
    for review, label in zip(reviews, labels):
        for sentence in set(tokenize_sentences(review)):
            sentence_to_courses[sentence].add(label)

    return {s: courses.pop() for s, courses in sentence_to_courses.items() if len(courses) == 1}


def infer_courses(reviews, signatures):
    """Vote per review using its signature sentences; body sentences skip the masked opener."""
    guesses = []
    for review in reviews:
        tally = defaultdict(int)
        for sentence in set(tokenize_sentences(review)[1:]):
            course = signatures.get(sentence)
            if course is not None:
                tally[course] += 1
        guesses.append(dict(tally))
    return guesses


def reinstate_course_name(review, course):
    """Swap the generic slot phrase in the opening sentence back to the real course name."""
    head, _, remainder = str(review).partition(". ")
    head = COURSE_SLOT.sub(course, head, count=1)
    return f"{head}. {remainder}" if remainder else head


def rank_neighbors(query_block, pool_block, pool_indices):
    sims = cosine_similarity(query_block, pool_block)
    k = min(TOP_K, pool_block.shape[0])
    part = np.argpartition(-sims, k - 1, axis=1)[:, :k]
    rows = np.arange(sims.shape[0])[:, None]
    order = np.argsort(-sims[rows, part], axis=1)
    return [[int(pool_indices[j]) for j in part[r][order[r]]] for r in range(sims.shape[0])]


def build_submission(train, test, tallies, vec, train_matrix, test_matrix):
    labels = train["Course"].to_numpy()
    ids = train["Index"].to_numpy()

    by_course = defaultdict(list)
    for pos, label in enumerate(labels):
        by_course[label].append(pos)
    by_course = {c: np.array(p) for c, p in by_course.items()}

    resolved = defaultdict(list)
    pending = []
    for row, tally in enumerate(tallies):
        if len(tally) == 1:
            resolved[next(iter(tally))].append(row)
        elif len(tally) > 1:
            pending.append(row)
        else:
            resolved[None].append(row)

    picks = [None] * test_matrix.shape[0]

    for course, rows in resolved.items():
        query_block = test_matrix[rows]
        if course is None:
            picks_batch = rank_neighbors(query_block, train_matrix, ids)
        else:
            pool = by_course[course]
            picks_batch = rank_neighbors(query_block, train_matrix[pool], ids[pool])
        for r, p in zip(rows, picks_batch):
            picks[r] = p

    # Tie between competing courses -> let global similarity arbitrate.
    all_ids = ids.tolist()
    for row in pending:
        sims = cosine_similarity(test_matrix[row], train_matrix).ravel()
        best_course, best_score = None, -1.0
        for course in tallies[row]:
            top = np.sort(sims[by_course[course]])[::-1][:20].sum()
            if top > best_score:
                best_course, best_score = course, top
        pool = by_course[best_course]
        picks[row] = rank_neighbors(test_matrix[[row]], train_matrix[pool], ids[pool])[0]

    return pd.DataFrame({
        "Index": test["Index"].to_numpy(),
        "Index_list": picks,
    })


def main():
    train = pd.read_csv(TRAIN_FILE)
    test = pd.read_csv(TEST_FILE)

    signatures = mine_course_signatures(train["Reviews"], train["Course"])
    tallies = infer_courses(test["Reviews"], signatures)
    decided = sum(1 for t in tallies if t)
    print(f"[signatures] {len(signatures)} mined | {decided}/{len(test)} test rows resolved")

    restored_test = [
        reinstate_course_name(r, next(iter(t)) if t else "")
        for r, t in zip(test["Reviews"], tallies)
    ]

    vec = TfidfVectorizer(ngram_range=NGRAMS, sublinear_tf=True)
    train_matrix = vec.fit_transform(train["Reviews"])
    test_matrix = vec.transform(restored_test)

    submission = build_submission(train, test, tallies, vec, train_matrix, test_matrix)
    submission.to_csv(OUTPUT_FILE, index=False)
    print(f"Wrote {OUTPUT_FILE} with shape {submission.shape}")


if __name__ == "__main__":
    main()
