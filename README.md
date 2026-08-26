# PadhAI — Tera Learning, AI ke Saath

**Your goal. Your learning path. *Tera Goal, Tera Raasta, AI ke Saath.***

> Hinglish rebrand of PathFinder / Astrolabe — same AI-powered learning-path engine, now with a desi vibe.

PadhAI is an AI-powered personalized learning-path recommender built for the
HCL hackathon. Tell it where you want to go in plain language — it figures out
where you are, finds your skill gaps, and builds an ordered, prerequisite-aware
roadmap of courses, projects, and assessments. Every recommendation is
explained, progress is tracked, and the path adapts to your feedback.

```
Learner Goal → Goal Understanding → Learner Profile → Skill Gap Analysis
→ ML Ranking (TF-IDF) → Prerequisite Validation → Path Generator
→ Milestones → Explanations → Dashboard → Progress → Feedback → Adaptation
```

## Highlights

- **Natural-language goals** — "I want to become an AI/ML engineer in 8 months" is parsed into a structured goal (Groq, backend-only)
- **Conversational profiling** — a few targeted questions, then a confirmable learner profile
- **Real ML ranking** — TF-IDF + cosine similarity over a course catalog built from `Data/train.csv`, reusing `Model/solution.py` unmodified via a clean adapter
- **Prerequisite-aware paths** — priority topological sort: foundations first, never a resource before its prerequisite
- **"Why this?" everywhere** — grounded explanations from structured path data; the mentor answers only from real context
- **Adaptive** — "too difficult" inserts prerequisite material; "already know" raises skills and skips ahead
- **What-if simulation** — try 3 hrs/week vs 10 without touching your real plan

## Tech Stack

| Layer | Tools |
|---|---|
| Backend | Python 3.13 · FastAPI · Pydantic v2 · SQLAlchemy + SQLite · pytest |
| ML | scikit-learn TF-IDF (`Model/solution.py`) + Groq (`langchain-groq`) |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS · TanStack Query · Zustand · Framer Motion |

## Project Layout

```
├── Data/train.csv        # source catalog (course reviews dataset)
├── Model/solution.py     # original ML matcher — used as-is
├── backend/app/          # FastAPI app (api/ services/ ml/ models/ schemas/)
├── backend/tests/        # offline API test suite
└── frontend/src/         # React SPA (pages/ components/ lib/)
```

## Run It

### Backend

```powershell
cd backend
uv sync                                   # first time only
uv run uvicorn app.main:app --reload --port 8000
```

Health check: http://127.0.0.1:8000/api/health — API docs: http://127.0.0.1:8000/docs

First boot builds a cached course catalog from `Data/train.csv`
(`backend/app/ml/_catalog_cache.json`). Delete that file if you change the CSV.

### Frontend

```powershell
cd frontend
npm install                               # first time only
npm run dev                               # http://localhost:5173
```

### Configuration

Copy `backend/.env.example` to `backend/.env` and fill:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=your_selected_model
```

The Groq key lives **only** in the backend environment. It is never shipped to
the browser, never placed in any `VITE_*` variable, and `.env` is gitignored.

### Tests

```powershell
cd backend
uv run pytest          # offline & deterministic — Groq calls are stubbed
```

### Deployment (Vercel + Render)

A `render.yaml` blueprint is included — create a **Blueprint** service on Render
pointing at this repo and fill in the `GROQ_API_KEY` secret when prompted.

1. **Backend (Render)** — blueprint provisions it from `render.yaml`
   (`rootDir: backend`, start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`,
   health check `/api/health`). Note the free tier uses an ephemeral disk, so
   SQLite data reseeds on each deploy/restart; use Postgres or a persistent
   disk for durable data.
2. **Frontend (Vercel)** — import the repo with **Root Directory = `frontend`**,
   then set the env var:

   ```env
   VITE_API_BASE=https://padhai-api.onrender.com   # your Render URL
   ```

3. **CORS** — set `FRONTEND_URL` / `CORS_ORIGINS` on Render to your Vercel URL
   (comma-separated for preview domains), then redeploy.

## Demo Script (~3 min)

1. Landing → enter *"I want to become an AI/ML engineer in 8 months"*
2. Answer profile questions → confirm profile
3. Watch the analysis stages → personalized roadmap renders
4. Click **Why is this next?** on any node → grounded explanation
5. Dashboard → mark a resource complete → next action updates
6. Give **Too difficult** feedback → recommendations adapt
7. Run what-if: **3 hrs/week** → simulated longer path; real path unchanged
