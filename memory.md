# Pathwise — Project Memory

> Single source of truth for the state of this repo. Read this before doing any work.

---

## 1. What This Project Is

**Pathwise** — AI-powered personalized learning-path recommender built for an **HCL hackathon/demo**.

Product promise: learner states a goal in natural language → system understands where they are → finds skill gaps → builds an ordered, prerequisite-aware learning path using the existing ML model (`Model/solution.py`) + Groq for language tasks → explains every recommendation → tracks progress → adapts to feedback and what-if simulations.

Core pipeline (from `instruction.md`):

```
Learner Goal → Goal Understanding → Profile → Skill Gap Analysis
→ Existing ML model (solution.py) → Ranking → Prerequisite Validation
→ Path Generator → Milestones → Explanation → Dashboard
→ Progress → Feedback → Adaptation
```

Key spec docs in repo root:
- `instruction.md` — the full build spec (2327 lines): pages, API contract, DB schema, design system, demo script, phases 0–14.
- `design.md`, `DESIGN_INSTRUCTION.md` — visual/design rules (dark theme, anti-AI-slop rules).

---

## 2. Tech Stack

### Backend (`backend/`)
- Python >= 3.13, managed with **uv** (`pyproject.toml`, `[tool.uv] package = false`, `uv.lock`)
- FastAPI 0.135.3 + Uvicorn 0.34, Pydantic v2
- SQLAlchemy 2.x ORM on **SQLite** (`backend/pathwise.db`; also stale `pathwise_diag.db`)
- scikit-learn / pandas / numpy — TF-IDF + cosine similarity
- Groq via `langchain-groq` + `groq` SDK (**backend-only**, key in `.env`)
- Entry point: `app.main:app`

### Frontend (`frontend/`)
- React 19 + TypeScript + Vite
- Tailwind CSS, Lucide icons
- TanStack Query (server state) + Zustand (client state, persisted to localStorage key `pathwise_state_v1`)
- Framer Motion for meaningful transitions
- API base: `VITE_API_BASE || http://127.0.0.1:8000`

### Data / Model
- `Data/train.csv` (56.7 MB course reviews), `test.csv`, `sample_submission.csv` — Kaggle-style course-matching dataset
- `Model/solution.py` — original TF-IDF + cosine-similarity course matcher; exports `rank_neighbors()` which is reused verbatim by the backend adapter

---

## 3. How To Run

```powershell
# Backend (uv environment)
cd D:\CODE\HCL\PathFinder\backend
uv sync                                   # first time only
uv run uvicorn app.main:app --reload --port 8000

# Frontend
cd D:\CODE\HCL\PathFinder\frontend
npm run dev                               # http://localhost:5173

# Health check / API docs
http://127.0.0.1:8000/api/health          # {"status":"ok","groq_configured":true}
http://127.0.0.1:8000/docs
```

Env files:
- `backend/.env` — has real `GROQ_API_KEY` (configured, working). NEVER commit/expose.
- `backend/.env.example` — blank placeholders (`GROQ_MODEL=qwen/qwen3.6-27b` default).
- `backend/.gitignore` covers `.env`.

⚠️ **Fixed Aug 24, 2026:** cold start used to take ~2–4 min because `ml/catalog_builder.py` re-parsed `train.csv` every boot. Now cached to `backend/app/ml/_catalog_cache.json` keyed by CSV size+mtime (7.4s first build → 0.07s cached; full boot ≈ 27s, dominated by Python/sklearn import time). Delete the cache file to force a rebuild after changing train.csv.

---

## 4. Repository Layout

```
D:\CODE\HCL\PathFinder\
├── instruction.md            # Master spec (checklists, phases, demo script)
├── design.md                 # Design rules
├── DESIGN_INSTRUCTION.md     # More design rules
├── memory.md                 # THIS FILE
├── Data/
│   ├── train.csv             # 56.7MB course reviews (source of catalog)
│   ├── test.csv              # 5.2MB
│   └── sample_submission.csv
├── Model/
│   ├── solution.py           # ORIGINAL ML model — TF-IDF matcher, DO NOT rewrite
│   │                         #   key fn used: rank_neighbors(query_block, pool_block, pool_indices)
│   ├── submission.csv        # Kaggle output from running solution.py standalone
│   └── __pycache__/
├── skill/                    # Copied agent SKILL.md references (gsap, three-js, etc.) — not app code
└── backend/
    ├── pyproject.toml / uv.lock / requirements.txt
    ├── .env / .env.example / .gitignore
    ├── main.py               # STUB ("Hello from backend!") — real entry is app/main.py
    ├── pathwise.db           # SQLite database
    ├── pathwise_diag.db      # leftover diag db
    └── app/
        ├── main.py           # FastAPI app: CORS, lifespan (create tables → seed → rebuild_model)
        ├── config.py         # env loading, GROQ_*, DATABASE_URL, CORS_ORIGINS
        ├── database.py       # engine/SessionLocal/get_db
        ├── seed.py           # skills ontology (~40 skills, multi-domain) + demo learners + resources from catalog_builder
        ├── schemas/__init__.py  # ALL Pydantic models (GoalAnalysis*, PathOut, SimulateRequest, DashboardResponse…)
        ├── models/__init__.py   # SQLAlchemy: Skill, Resource, Learner, LearningPath, LearningStep, Progress, Feedback, Conversation
        ├── ml/
        │   ├── solution.py import → rank_neighbors reused
        │   ├── ml_adapter.py    # RecommendationModel wraps TF-IDF over resource docs; get_model()/rebuild_model()
        │   └── catalog_builder.py # parses Data/train.csv → distinct courses become Resources (domain rules, slug ids)
        ├── api/
        │   ├── goals.py         # POST /api/goals/analyze
        │   ├── profiles.py      # POST /api/profile, GET /api/profile/{id}
        │   ├── recommendations.py # GET /api/recommendations/{learner_id}
        │   ├── paths.py         # POST generate, GET {id}, POST {id}/adapt, POST simulate,
        │   │                    # GET {path_id}/steps/{step_id}/explain  ← "Why this?"
        │   ├── progress.py      # POST /api/progress, GET /api/progress/{learner_id}
        │   ├── feedback.py      # POST /api/feedback
        │   ├── mentor.py        # POST /api/mentor/chat
        │   └── dashboard.py     # GET /api/dashboard/{learner_id}
        └── services/
            ├── groq_service.py       # parse_goal(), mentor chat, explanations (structured prompts, JSON out)
            ├── goal_service.py       # thin wrapper over parse_goal
            ├── profile_service.py    # profile CRUD
            ├── skill_gap_service.py  # compute_gaps(), required_for(target_role, goal)
            ├── recommendation_service.py # candidates → ML relevance → gap/interest/prereq/difficulty/time fit → match_score + reason
            ├── path_generator.py     # dependency graph, topo order, statuses (completed/current/recommended/locked), milestones, timeline
            ├── simulate_service.py   # what-if simulation (no mutation of real profile)
            ├── adaptive_service.py   # feedback → adaptation rules (too_difficult→easier prereqs, already_know→skip ahead)
            ├── progress_service.py   # progress writes, step status updates
            ├── explanation_service.py # grounded "Why is this next?" text via Groq
            ├── mentor_service.py     # gathers learner context → grounded mentor answers
            └── dashboard_service.py  # metrics aggregation (path %, streak, hours/week, continue card, next actions)

Frontend (frontend/src/)
├── main.tsx, App.tsx        # Routes: / /onboarding /profile /analyzing /path + AppShell( /dashboard /skills /courses /projects /mentor )
├── index.css                # Tailwind + dark theme tokens (#09090B bg, purple accent #8B5CF6, teal progress)
├── lib/
│   ├── api.ts               # centralized fetch client (all endpoints typed)
│   ├── store.ts             # zustand: learnerId, pathId, goalAnalysis, profileDraft (localStorage-persisted)
│   └── types.ts             # TS interfaces mirroring Pydantic schemas
├── components/
│   ├── AppShell.tsx         # sidebar layout for dashboard section
│   ├── LearningPath.tsx     # connected node visualization
│   ├── ResourceCard.tsx
│   └── ui.tsx               # SkillBar, pills, cx helper, shared primitives
└── pages/
    ├── Landing.tsx          # hero "Your goal. Your learning path.", how-it-works
    ├── Onboarding.tsx       # natural-language goal input + example chips
    ├── ProfileSetup.tsx     # conversational profile questions + confirmation
    ├── Analyzing.tsx        # staged generation sequence (goal→skills→gaps→prereqs→rank→path)
    ├── Path.tsx             # signature page: route viz, node detail panel w/ Why-this, Start button, WhatIf panel (study-hours slider → /simulate)
    ├── Dashboard.tsx        # metrics, Continue-learning card, Next actions, skills bars, recent feedback
    ├── Skills.tsx Courses.tsx Projects.tsx Mentor.tsx
```

---

## 5. Database Schema (SQLite)

- **skills**(id, name, domain) — ~40 skills across Programming Languages, Frontend, Backend, Databases, DevOps, Cloud, Mobile, Data, ML/AI…
- **resources**(id, title, type[course|project|assessment|article], domain, difficulty[beginner|intermediate|advanced], duration_hours, format, description, skills_gained JSON, prerequisites JSON, phase, optional bool, rating float) — seeded from distinct courses in train.csv via catalog_builder
- **learners**(id, name, goal, target_role, timeline_months, interests, experience_level, current_skills JSON {skill:0-100}, completed_courses, objectives, study_time_per_week, preferred_format/pace/difficulty, learning_history)
- **learning_paths**(id, learner_id FK, goal, target_role, timeline_months, study_time_per_week, created_at)
- **learning_steps**(id, path_id FK, resource_id FK, order, phase, status[completed|current|recommended|locked], completion_percentage, estimated_hours, milestone bool, recommendation_score, reason, prerequisites, skills_gained)
- **progress**(id, learner_id, resource_id, completion_percentage, status, time_spent_hours, updated_at)
- **feedback**(id, learner_id, resource_id, helpful bool, reason[toodifficult|already_know|not_interested|too_long|not_relevant|other])
- **conversations**(id, learner_id, role[user|assistant], message, sources JSON)

---

## 6. ML Pipeline (how solution.py is integrated)

1. On startup: `catalog_builder.get_catalog_resources()` reads `Data/train.csv`, dedupes courses, maps titles→domains via substring rules, aggregates reviews into descriptions → seeded as `Resource` rows.
2. `rebuild_model(all_resources)` fits `TfidfVectorizer(ngram_range=(1,2), sublinear_tf)` over weighted docs (title×2, domain×2, skills×2, difficulty, description).
3. At request time, learner profile text (goal + interests + target role) is vectorized; `solution.py`'s `rank_neighbors` returns top-k similar resource ids; cosine sims become transparent **model_relevance** scores (labeled "Match/Fit", never "AI confidence").
4. `recommendation_service` blends: model_relevance + skill_gap_match + interest_match + prerequisite_fit + difficulty_fit + time_fit → match_score + human-readable reason.
5. `path_generator` topo-orders by prerequisites, marks first incomplete step as `current`, inserts milestones, estimates timeline from study_time_per_week.

Groq responsibilities (backend only): goal parsing → strict JSON validated by Pydantic; grounded explanations; mentor chat with learner context injected; feedback categorization.

---

## 7. Current Status (verified Aug 24, 2026)

### ✅ Working
- Full page flow exists: Landing → Onboarding → ProfileSetup → Analyzing → Path → AppShell(Dashboard/Skills/Courses/Projects/Mentor)
- All 8 backend routers registered; health endpoint OK; Groq configured (`groq_configured: true` verified live)
- End-to-end API surface implemented incl. adapt, explain-step, simulate, feedback, dashboard
- What-if simulation UI (study slider) wired to `/api/paths/simulate`
- Feedback UI in Courses.tsx wired to `/api/feedback` with mutation invalidation
- Zustand persistence so refresh keeps learnerId/pathId
- ML adapter reuses `solution.py` unmodified ✓ (spec requirement)
- Secrets: key only in backend `.env`; no VITE_ vars for it ✓

### 🐛 Known Bugs / Gaps (build these next, priority order)
1. ~~**TS build broken**~~ — FIXED Aug 24, 2026: added `interests: string[]` to `DashboardResponse` in `src/lib/types.ts`; `tsc --noEmit` exits 0.
2. ~~**Slow cold start (~2–4 min)**~~ — FIXED Aug 24, 2026: catalog cached to `backend/app/ml/_catalog_cache.json` keyed by CSV size+mtime; boot now ≈27s (sklearn import bound).
3. **No tests** — spec requires `backend/tests/` (health, goal analysis, prereq ordering, simulate-no-mutation). None exist.
4. **No git repo** — `git init` + commit not done yet (`.env` must be gitignored BEFORE committing).
5. **No root README** — run instructions in §3 should go there.
6. `backend/main.py` is a dead stub — delete or replace with uvicorn runner.
7. Stale artifacts to clean: `pathwise_diag.db`, various `.log/.err` files, `tsconfig.tsbuildinfo`.
8. `unlocks` field always `[]` from GET path endpoint (paths.py passes empty list) — could compute reverse-prereq graph.
9. Demo polish items from spec not yet verified: mobile layouts, reduced-motion, error/empty states audit, accessibility pass.
10. Mentor conversation history stored in DB but UI doesn't reload past messages on mount.

### ✅ Smoke-tested Aug 24, 2026
- Boot with cache: health OK in 27s (`groq_configured: true`)
- POST /api/profile → learner created; GET /api/recommendations/{id} → frontend goal returned "Frontend Skills Assessment" (match 0.73) — domain-aware catalog + ML adapter working end-to-end

---

## 8. Demo Script (from spec §60 — practice this)

1. Landing → enter "I want to become an AI/ML engineer in 8 months"
2. Answer profile questions → confirm profile
3. Watch analysis stages → personalized roadmap renders
4. Click "Why is Statistics next?" → grounded explanation
5. Dashboard → mark a resource complete → next action updates
6. Give "Too difficult" feedback → recommendations adapt
7. Run what-if: 3 hrs/week → simulated longer path, real path unchanged

## 9. Conventions & Rules (from instruction.md — obey these)

- Never expose GROQ_API_KEY client-side; never label heuristic scores as "AI confidence"
- No fake stats/testimonials/decorative charts; no robot illustrations/purple blobs/glassmorphism spam
- Motion only when meaningful; respect prefers-reduced-motion
- Dark theme tokens: bg #09090B, surface #111114, elevated #18181C, border #27272A, text #F4F4F5/#A1A1AA, purple=brand/action, teal=progress, green/amber/red/blue semantic
- Frontend state flows through backend API — no disconnected fake screens
- Keep app runnable after every change; update instruction.md checklists as work progresses
