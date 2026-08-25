# Astrolabe — Backend

The Astrolabe backend is a FastAPI service that generates personalized learning
paths from a learner's goal, using a TF-IDF + cosine-similarity course matcher
(`Model/solution.py`) trained on the real course data in `Data/train.csv`, plus
an LLM (Groq, via LangChain) for goal parsing and natural-language explanations.

## Stack

- **FastAPI** + **SQLAlchemy** (SQLite by default)
- **scikit-learn** — TF-IDF corpus built from course descriptions
- **LangChain (`langchain-groq`)** — `ChatGroq` wrapper around the Groq API
- **Model/solution.py** — the user's ML course matcher (kept in `../Model`)

## Setup (with [uv](https://docs.astral.sh/uv/))

```bash
cd backend
uv venv                      # create .venv
uv sync                      # install dependencies from pyproject.toml
cp .env.example .env         # then set GROQ_API_KEY (see below)
uv run uvicorn app.main:app --reload --port 8000
```

> `uv sync` reads `pyproject.toml`. A `requirements.txt` is kept for reference,
> but `uv.lock` is the source of truth for pinned versions.

Alternatively, run any command through `uv` without activating the venv:

```bash
uv run uvicorn app.main:app --reload --port 8000
```

The API docs are available at `http://127.0.0.1:8000/docs`.

## Configuration (`.env`)

| Variable        | Default                     | Purpose                                   |
|-----------------|-----------------------------|-------------------------------------------|
| `GROQ_API_KEY`  | _(empty)_                   | Enables LLM goal parsing & explanations   |
| `GROQ_MODEL`    | `qwen/qwen3.6-27b`          | Groq model used by `ChatGroq`             |
| `DATABASE_URL`  | `sqlite:///../astrolabe.db`  | SQLAlchemy DB URL                         |
| `FRONTEND_URL`  | `http://localhost:5173`     | CORS origin                               |

A key is provided for local development; set it in `.env`:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=qwen/qwen3.6-27b
```

If `GROQ_API_KEY` is empty, the service falls back to deterministic heuristics
(`groq_service.heuristic_goal`) and template-based explanations, so the app
still works fully offline.

> **Note on models:** the `qwen/qwen3.6-27b` model emits `<think>` reasoning
> blocks. `groq_service._strip_think` removes them, and `groq_chat` uses a
> larger token budget so reasoning completes before the final answer. If you
> switch models, pick one available on your Groq account.

## How a learning path is generated

1. **Catalog from data.** `ml/catalog_builder.py` reads every distinct course
   in `Data/train.csv` (≈80 courses) and turns it into a `Resource` whose
   description is aggregated learner reviews (the TF-IDF corpus). Each resource
   gets a `domain` (Frontend, Backend, ML, …), a `difficulty`, curated
   `prerequisites`, and a capstone `project` per domain.
2. **Goal → query.** `services/path_generator.py` builds a profile text from
   the learner's goal/role/interests and expands it with domain vocabulary
   (`GOAL_EXPANSION`) so the ML query is specific.
3. **Model ranking.** `ml/ml_adapter.get_model(resources).score(text)` returns
   a relevance score per resource using `Model/solution.py`'s cosine similarity.
4. **Gap-aware blending.** Scores are blended with the learner's priority gaps
   (`0.75·model + 0.25·gap_boost`) so weak required skills are surfaced.
5. **Selection & ordering.** `_select_for_goal` keeps the top matches and pulls
   in prerequisite closure (so advanced courses aren't permanently *locked*);
   `_ensure_capstone` appends a portfolio project for the dominant domain;
   `_order_for_path` presents foundational courses first.
6. **Status DAG.** Steps are marked `completed / current / recommended / locked`
   based on prerequisite satisfaction (`progress_service._recompute_steps`).

## Evidence-based explanations

`/api/paths/{path_id}/steps/{step_id}/explain` returns *why* a step is next and
appends real learner-review snippets from the resource description
(`explanation_service._evidence`). This is the product differentiator:
recommendations are grounded in actual course reviews, not generic text.

## API reference

All routes are prefixed with `/api`.

| Method | Path                                            | Description                                  |
|--------|-------------------------------------------------|----------------------------------------------|
| GET    | `/health`                                       | Health + `groq_configured` flag              |
| POST   | `/goals/analyze`                                | Parse a free-text goal → structured fields   |
| POST   | `/profile`                                      | Create a learner profile                     |
| GET    | `/profile/{learner_id}`                         | Fetch a learner profile                      |
| GET    | `/recommendations/{learner_id}`                | Goal-aware course recommendations            |
| POST   | `/paths/generate`                              | Generate a learning path for a learner       |
| GET    | `/paths/{path_id}`                             | Fetch a generated path                       |
| POST   | `/paths/{path_id}/adapt`                       | Re-adapt the path after feedback             |
| POST   | `/paths/simulate`                              | "What-if" timeline simulation                |
| GET    | `/paths/{path_id}/steps/{step_id}/explain`     | Step rationale + review evidence             |
| POST   | `/progress`                                     | Record step progress (updates step statuses) |
| GET    | `/progress/{learner_id}`                        | Learner progress summary                     |
| POST   | `/feedback`                                     | Resource feedback (helpful / not)            |
| POST   | `/mentor/chat`                                  | Conversational mentor assistant              |
| GET    | `/dashboard/{learner_id}`                       | Dashboard aggregate (skills, next steps)     |

## Notes

- On startup (`main._startup`) the DB tables are created and the catalog is
  seeded from `Data/train.csv`; the ML model is rebuilt from the seeded
  resources. If the course set changes, the seeder refreshes the catalog.
- IDs for `Progress`, `Feedback`, and `Conversation` are auto-generated UUIDs,
  so `POST /api/progress`, `/api/feedback`, and `/api/mentor/chat` no longer
  require the caller to supply an id.
- There is currently **no authentication**; `learner_id` is client-generated
  and trusted. Add auth before any production deployment.
