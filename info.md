# PadhAI — Project Brief for Hackathon PPT Generation
> **Single source of truth for any AI that has to build the deck. Copy this whole file as context.**

---

## 0) Instruction for the PPT AI (READ THIS FIRST)

**Goal:** Build a beautiful, winning HCL hackathon deck for **PadhAI** that feels premium, not templated. The jury should understand the problem, the AI-engine, and the live demo in 4 minutes.

**Style direction — Volcanic Ash (non-negotiable):**
- Background: dark canvas `#111214` dominates (70%), surface `#1C1E21` / `#292C30`, hairline borders `rgba(255,255,255,.09)`.
- Accent discipline: **Violet `#8338EC` = primary action**, **Orange `#FB5607` = data/metrics**, **Green `#3DDC84` = completed**. Orange is NEVER used for buttons.
- Typography: Display `Space Grotesk` + Body `Inter` + Data `IBM Plex Mono`. Display 56/40/28px, tight tracking `-1.8 / -1.0 / -0.6px`.
- Cards: flat, solid, `12px` radius, `8px` buttons, no shadows except Level-3 dropdowns/modals. Hover = `border-strong` + `surface-hover`, no lift/translateY.
- Motion: `Framer Motion`, 150-200ms, `cubic-bezier(0.16,1,0.3,1)`, respect `prefers-reduced-motion`.
- Layout: `1280px` container, `48px` section padding, `24px` card padding. No crowded slides — one idea per slide, generous whitespace, hairline dividers.

**Deck spec:**
- 13 slides, 16:9, exported PDF + pptx. Use real screenshots/mockups where listed, not stock illustrations.
- Fonts must be embedded (Inter + Space Grotesk + IBM Plex Mono via Google Fonts).
- Every claim needs a visual: pipeline diagram, dependency graph, skill bars, code snippet or API table — no walls of text.
- Last slide: QR to live demo + GitHub.

**Slide outline to follow (exact order):**

| # | Title | Layout hint |
|---|---|---|
| 1 | **Cover** — `PadhAI — Tera Learning, AI ke Saath` + tagline + team | Full-bleed hero, radial violet glow `rgba(131,56,236,.09)` at 72% 10%, diamond ◆ logo on `#8338EC` |
| 2 | **Problem** — course overload vs personal goal | 2-col: left 3 pain bullets with icons, right stat card: 80+ courses, infinite combinations |
| 3 | **Solution** — one sentence + 3 pillars | Centered headline `Your goal. Your path. Your pace.` + 3 cards: Understand / Map / Build |
| 4 | **How it works** — pipeline | Horizontal 5-step pipeline with arrows: `Goal → Profile → Gap → ML Ranking → Prerequisite DAG → Path` |
| 5 | **Architecture** — frontend / backend / ML / LLM | Diagram: `React+TS+Vite` → `FastAPI` → `SQLite+SQLAlchemy` → `TF-IDF (sklearn)` → `Groq (Qwen 3-27B)` |
| 6 | **Evidence Engine** — the differentiator | Split: left code `mine_course_signatures()` + TF-IDF centroids, right evidence card with review snippets + similarity `94%` |
| 7 | **User Journey** — 3-min demo | Timeline 7 dots: Landing → Onboarding (7 steps) → Analysis → Path → Explain → Dashboard → Adapt/Simulate |
| 8 | **Screens** — Landing + Onboarding | 2 mockups: Landing hero (path preview) + Onboarding step 6 analysis (`Domain · Detected skills`) |
| 9 | **Screens** — Path + Skill Gap + Dashboard | 3-up: DAG statuses (`completed/current/recommended/locked`), skill bars, dashboard next-actions |
| 10 | **Adaptive & What-If** | Simulation cards: `6h/wk → 8mo` vs `3h/wk → 11mo` → keeps core + project |
| 11 | **AI Mentor** | Chat bubble before/after: `Why is React next?` → grounded answer citing prerequisite coverage, no hallucinations |
| 12 | **Tech Stack & Deployment** | Table (stack) + `Vercel (frontend) + Render (backend)` + health `GET /api/health` |
| 13 | **Impact & Roadmap** | Metrics (relevance 70%+, completion) + Phase 2/3 roadmap + CTA `Build my learning path →` + QR |

**Copy tone:** Hinglish, confident, desi warmth (`Tera Goal, Tera Raasta`) but technically precise. Every slide subtitle ≤12 words. Use `IBM Plex Mono` for numbers/metrics.

**Assets you may screenshot/mock:** `frontend/src/pages/Landing.tsx`, `Onboarding.tsx`, `LearningPath.tsx`, `Dashboard.tsx`, `SkillGap.tsx`, `Mentor.tsx`. The CSS lives in `frontend/src/index.css` — reuse tokens, do not invent new colors.

---

## 1) Identity

- **Name:** **PadhAI — Tera Learning, AI ke Saath** (tagline: *Tera Goal, Tera Raasta, AI ke Saath.*)
- **Former names:** PathFinder / Astrolabe (same engine, Hinglish rebrand for HCL hackathon).
- **One-liner:** Tell it where you want to go in plain language — it finds where you are, exposes your gaps, and builds an ordered, prerequisite-aware roadmap of courses, projects and assessments, every step explained and backed by real learner reviews.
- **Positioning:** Not a playlist, not a chatbot wrapper — a **deterministic path engine with evidence**.
- **Repo:** `HclTech-Path-Finder` — `backend/` (FastAPI), `frontend/` (React), `Data/train.csv` (catalog source), `Model/solution.py` (frozen ML matcher).

## 2) Problem & Opportunity

- Learners face **catalog overload**: 80+ courses, overlapping topics, unclear prerequisites.
- Generic recommenders suggest popular courses, not *your* missing skills.
- No explanation → no trust. No prerequisite order → learners hit walls.
- Opportunity: **Goal-driven, gap-aware, evidence-backed sequencing** that adapts when the learner does.

## 3) Solution Summary

```
Learner Goal → Goal Understanding (Groq/NLP) → Learner Profile → Skill Gap Analysis
→ ML Ranking (TF-IDF cosine on review corpus) → Prerequisite Validation (DAG topo-sort)
→ Path Generator (capstone + milestones) → Explanations (review evidence)
→ Dashboard / Progress → Feedback → Adaptation → What-if Simulation
```

**Three guarantees:**
1. **No magic** — deterministic ML ranking + gap-blended scores (`0.75·model + 0.25·gap_boost`).
2. **No prerequisites before foundations** — priority topological sort.
3. **No hallucinations** — mentor answers only from context + evidence.

## 4) Key Features (what judges will test)

| Feature | What it does | Why it wins |
|---|---|---|
| **Natural-language goals** | `POST /api/goals/analyze` parses “I want to become an AI/ML engineer in 8 months” into `{domain, target_role, timeline_months, detected_skills[], objectives[], missing_information[], summary}` via `ChatGroq (qwen/qwen3.6-27b)` with deterministic heuristic fallback | No forms fatigue |
| **7-step onboarding** | Goal → Role → Timeline → Interests → Experience/Pace/Study hrs → Current skills (`Skill: level` per line) → Analysis summary | Profile is confirmable, not inferred |
| **Real ML ranking** | `Model/solution.py` reused **unmodified** via `backend/app/ml/ml_adapter.py` + `evidence_engine.py`. TF-IDF over aggregated review descriptions, cosine to expanded goal query (`GOAL_EXPANSION` vocab) | Real model, not mock scores |
| **Prerequisite DAG** | `services/path_generator.py` does prerequisite closure + `_ensure_capstone` (domain project) + `_order_for_path` (foundations first). Steps have `status: completed/current/recommended/locked/optional` + `unlocks[]` | Never a resource before its prereq |
| **Skill Gap Cards** | `GET /api/dashboard/{id}` returns `skills[{skill,level,required,gap,domain}]` + `priority_gaps[]` rendered as mono % bars | At-a-glance gaps |
| **“Why this?” evidence** | `GET /api/paths/{path_id}/steps/{step_id}/explain` returns `Evidence{course_signatures[12], matched_signatures, similarity, peer_courses (domain-affinity filtered), source}` mined by `mine_course_signatures()` (sentence occurs in exactly one course) | Backed by real reviews, not LLM fluff |
| **Adaptive feedback** | `POST /api/feedback {helpful, reason}` — “too difficult” inserts prerequisite material, “already know” raises skills & skips | Path learns |
| **What-if simulation** | `POST /api/paths/simulate {study_time_per_week, experience_level, …}` — re-plans without touching real path, comparison `current vs simulated + changes_summary[]` | Safe experimentation |
| **AI Mentor** | `POST /api/mentor/chat` — LangChain Groq grounded in `{goal, path, progress}`; `GET /api/mentor/history/{id}` for thread | Contextual, not generic |
| **Dashboard** | `GET /api/dashboard/{id}` aggregates `path_complete_pct, streak_days, hours_this_week, continue_resource/next_actions` + progress map + skill radar | One place to continue |

## 5) User Journey (3-min demo script)

1. **Landing (`/`)** — hero `Your goal. Your path. Your pace.` + path preview card (8 months · 6h/week, 42% prereqs, 18 steps) → CTA `Build my learning path`.
2. **Onboarding (`/onboarding`)** — 7 steps with progress bar; step 7 fires `POST /api/goals/analyze` and shows `Domain · target_role · detected skills · missing info`.
3. **Create profile** — `POST /api/profile` (Zustand `useLearner` persists `learner_id`), then `POST /api/paths/generate`.
4. **Learning Path (`/path`, `/learning-path`)** — vertical DAG, inline nodes `HTML&CSS ✓ Completed → JS Current → React Recommended → Capstone Locked·milestone`. Click any node → step detail.
5. **Step Detail (`/path/:stepId`)** — `Why is this next?` fetches `…/explain`, renders evidence quotes in mono + similarity + peer courses.
6. **Dashboard (`/dashboard`)** — `continue_resource`, `path_complete_pct`, `skills_covered`, `next_actions[3–5]`, progress overview, comparison on simulate.
7. **Feedback & Simulation** — `Too difficult / Already know` via `POST /api/feedback` + `POST /api/paths/simulate` with `3h vs 10h/week` — real path unchanged.

> Tip for presenter: use `I want to become a Frontend Engineer in 6 months` for fast DAG, or `AI/ML engineer in 8 months` for deeper chain.

## 6) Architecture

**High-level:**
```
[Vite + React 19 + TS] —(TanStack Query + Zustand + Framer Motion + Recharts + lucide)→
[FastAPI 0.135 + Pydantic v2 + SQLAlchemy + SQLite (→ Postgres on Vercel)] →
                ├─ ML: scikit-learn TF-IDF (ngram 1-3, sublinear_tf) over Data/train.csv
                ├─ Evidence: signature_bank.json (12 phrases/course) + _evidence_cache.pkl (vectorizer+centroids)
                └─ LLM: langchain-groq ChatGroq (qwen/qwen3.6-27b, _strip_think, larger token budget)
```

**Catalog build:** `ml/catalog_builder.py` aggregates `Data/train.csv` Reviews per Course (≈80 distinct courses) → `Resource{domain, difficulty, prerequisites, project, description}`. Cached to `backend/app/ml/_catalog_cache.json` + `signature_bank.json` so cold clones (CSV gitignored, 56MB) still boot. Delete caches to rebuild from CSV.

**Path selection:** `services/path_generator.py` — expanded query → `ml_adapter.get_model(resources).score(text)` (cosine) → `0.75·model + 0.25·gap_boost` → `_select_for_goal` (top matches + prerequisite closure) → `_ensure_capstone` → `_order_for_path` (topo-sort).

**Frontend IA:**
- Routes: `/` Landing, `/onboarding`, `/profile`, `/path`, `/learning-path`, `/path/:stepId`, `/dashboard`, `/skills`→ SkillGap, `/courses`→Recommendations, `/projects`, `/mentor`, `/simulation`, `/progress`.
- State: `lib/types.ts` mirrors `backend/app/schemas/*` exactly; `lib/api.ts` typed client grouped by domain; `lib/hooks.ts` React-Query hooks; `store/useLearner.ts` holds `learner_id+profile+theme` in localStorage.
- Shell: `components/shell.tsx` (NavRail left: Dashboard/Learning Path/Recommendations/Progress/Mentor/Profile + TopBar + ThemeToggle), `components/ui.tsx` primitives, `product.paths/cards/panels.tsx` product blocks.
- Build: `npm run dev` (Vite 5, proxy `/api`), `npm run build` (`tsc -b && vite build`), fonts Inter+Space Grotesk+IBM Plex Mono via Google Fonts in `frontend/index.html:6`.

## 7) API Contract (base `/api`, no auth, CORS `allow_credentials=True`)

| Method | Path | Req | Res |
|---|---|---|---|
| GET | `/health` | — | `{status, version, groq_configured, database, resources, model_ready}` |
| POST | `/goals/analyze` | `{goal}` | `GoalAnalysisResponse{goal,domain,target_role,timeline_months?,objectives[],detected_skills[],missing_information[],summary}` |
| POST | `/profile` | `ProfileCreate{learner_id?, name, goal, target_role, timeline_months, interests[], experience_level, current_skills{}, completed_courses[], objectives[], study_time_per_week, preferred_format, preferred_pace, difficulty_preference, learning_history[]}` | `ProfileResponse` |
| GET | `/profile/{learner_id}` | — | `ProfileResponse` |
| GET | `/recommendations/{learner_id}` | — | `RecommendationsResponse{recommendations[RecommendationOut]}` |
| POST | `/paths/generate` | `{learner_id}` | `PathGenerateResponse{path_id, learner_id, goal, target_role, timeline_months, study_time_per_week, prerequisite_coverage_pct, steps[LearningStepOut]}` |
| GET | `/paths/{path_id}` | — | `PathOut{steps[]}` |
| POST | `/paths/{path_id}/adapt` | `{learner_id?}` | `PathGenerateResponse` |
| POST | `/paths/simulate` | `{learner_id, changes{study_time_per_week?, experience_level?, preferred_pace?, difficulty_preference?, add_interest?}}` | `SimulateResponse{current{}, simulated{}, changes_summary[], steps[]}` |
| GET | `/paths/{path_id}/steps/{step_id}/explain` | — | `MentorResponse{message, sources[], evidence{course_signatures[], matched_signatures[], similarity, peer_courses[], source}}` |
| POST | `/progress` | `{learner_id, resource_id, completion_percentage, status?, time_spent_hours}` | `ProgressResponse{..., next_action?, path_complete_pct}` + recomputes `completed/current/recommended/locked` |
| GET | `/progress/{learner_id}` | — | `{progress[{resource_id, completion_percentage, status, time_spent_hours}]}` |
| POST | `/feedback` | `{learner_id, resource_id, helpful, reason?}` | `FeedbackResponse{adaptation}` |
| POST | `/mentor/chat` | `{learner_id, message}` | `MentorResponse{message, sources[], evidence?}` |
| GET | `/mentor/history/{learner_id}` | — | `MentorHistoryItem[]{role, message, sources[]}` |
| GET | `/dashboard/{learner_id}` | — | `DashboardResponse{goal, target_role, timeline_months, study_time_per_week, interests[], path_id?, path_complete_pct, skills_covered, streak_days, hours_this_week, continue_resource?, continue_pct, continue_remaining_hours, next_actions[], skills[], priority_gaps[], recent_feedback[]}` |

Shared shapes: `ResourceOut{id,title,type,domain,difficulty,duration_hours,format,description,skills_gained[],prerequisites[],phase,optional,rating}`, `RecommendationOut{resource, evidence?, model_relevance, skill_gap_match, interest_match, prerequisite_fit, difficulty_fit, time_fit, evidence_score, match_score, reason}`, `LearningStepOut{id, resource_id, order, phase, status, completion_percentage, estimated_hours, milestone, recommendation_score, reason, prerequisites[], skills_gained[], resource, unlocks[], evidence?}`.

## 8) Evidence Engine Deep Dive (show this on slide 6)

- **Source:** `Model/solution.py` — `SENT_BOUNDARY` sentence split, `mine_course_signatures(reviews, courses)` keeps sentences that appear under **exactly one** course (the fingerprint), `tokenize_sentences`, `rank_neighbors` (cosine, `np.argpartition` top-10), `build_submission` + `reinstate_course_name`.
- **Adapter:** `backend/app/ml/evidence_engine.py` never edits `solution.py`. It builds `signature_bank.json` (top 12/corse, prefers content-rich non-namey sentences) + `_evidence_cache.pkl` (`TfidfVectorizer` `1-2gram, max 50k, min_df 5`, 80 centroids via `X[idx].mean(axis0)`). `explain(query_doc, course)` returns `Evidence` with `matched_signatures` (query sentence ∩ course signatures) + `cosine(qv, centroid)` + domain-affinity-filtered `peer_courses` (`DOMAIN_AFFINITY` map for Frontend↔Full Stack, ML↔Deep Learning↔MLOps, etc.).
- **Why it matters:** every “why” is citable. The PPT should show a card: top 3 `course_signatures` + `similarity 0.82` mono + `peer_courses` chips, with `source: evidence_engine`.

## 9) Design System — Volcanic Ash (for the PPT designer)

- **Tokens:** `frontend/src/index.css:12` palette (`ash-900 #1C1E21, violet-500 #8338EC, orange-500 #FB5607, green-400 #3DDC84`), aliases `--color-brand/accent/complete`. Dark is primary (`[data-theme="dark"]`), light is secondary (`[data-theme="light"]` warm `ash-50 #F4F2EF`).
- **Type:** `Space Grotesk` display 56px/-1.8, 40px/-1.0, 28px/-0.6; `Inter` body 18/16/15/14px; `IBM Plex Mono` for `skill 88%`, `similarity 0.82`, `10 hrs · Video`.
- **Components to screenshot:** `Landing.tsx` hero + `PathPreview` rail, `HowCard` trio, `InlineNode` statuses, `SkillRow` bars, simulation 3-cards (`Current 6h → Simulate 3h → Kept Core+Project`), mentor bubbles.
- **Do not:** use stock illustrations, new colors, glass on normal cards, lift shadows, or orange buttons.

## 10) Tech Stack & Repo

| Layer | Tools |
|---|---|
| Backend | Python 3.13 · FastAPI 0.135 · Pydantic 2.12 · SQLAlchemy 2 · SQLite (local) → Postgres (prod) · `uv` + `uv.lock` (requirements.txt mirror) · `pytest 8` (offline, Groq stubbed) |
| ML | `scikit-learn` TF-IDF `ngram (1,3)` + `(1,2)`, `cosine_similarity`, `pandas`, `numpy`, `scipy.sparse` · `Model/solution.py` frozen |
| LLM | `langchain-groq 0.2` + `groq 0.13` · `qwen/qwen3.6-27b` · `GROQ_API_KEY` backend-only (never `VITE_*`, `.env` gitignored), heuristic fallback when empty |
| Frontend | React 19 · TypeScript 5.6 (strict) · Vite 5.4 · Tailwind 3.4 · `@tanstack/react-query 5` · `zustand 4` · `framer-motion 11` · `recharts 2` · `lucide-react` · `react-router-dom 6` |
| Deploy | `render.yaml` (Render Blueprint: `rootDir backend`, `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`, `healthCheck /api/health`) + `backend/api/index.py` + `backend/vercel.json` (Vercel Python `@vercel/python` `api/index.py`), `frontend/vercel.json` SPA rewrite |

**Project layout:**
```
Data/train.csv (5.2+56MB, gitignored, seed for catalog — _catalog_cache.json is the committed derived artifact)
Data/test.csv
Model/solution.py + submission.csv
backend/app/{main.py, config.py, database.py, seed.py, api/{goals,profiles,recommendations,paths,progress,feedback,mentor,dashboard}, services/{goal_service,path_generator,progress_service,explanation_service,groq_service}, ml/{ml_adapter,catalog_builder,evidence_engine,_catalog_cache.json,signature_bank.json,_evidence_cache.pkl}, models/, schemas/}
backend/{.env.example, pyproject.toml, requirements.txt, vercel.json, api/index.py, tests/}
frontend/src/{main.tsx, App.tsx, index.css, vite-env.d.ts, lib/{types.ts,api.ts,hooks.ts}, store/useLearner.ts, components/{ui.tsx,shell.tsx,product.paths/cards/panels.tsx}, pages/{Landing,Onboarding,LearningPath,StepDetail,Dashboard,SkillGap,Recommendations,Mentor,Simulation,Progress,Profile}}
render.yaml
info.md  ← you are here
```

## 11) Run & Deploy (what to put on the last slide as QR targets)

**Local:**
```powershell
cd backend; cp .env.example .env  # set GROQ_API_KEY, GROQ_MODEL=qwen/qwen3.6-27b
uv sync; uv run uvicorn app.main:app --reload --port 8000   # docs /docs, health /api/health
cd frontend; npm install; npm run dev                        # http://localhost:5173
uv run pytest                                                 # backend tests, no network
```
First boot builds `_catalog_cache.json` from `Data/train.csv` (delete to rebuild). `DATABASE_URL` defaults to `sqlite:///padhai.db` (Render free tier ephemeral — seeded on each deploy; use Postgres for durable data).

**Prod:**
- Backend on **Render** via `render.yaml` (set secrets `GROQ_API_KEY`, `FRONTEND_URL`, `CORS_ORIGINS=https://your-frontend.vercel.app` + preview domains).
- Frontend on **Vercel** (`Root Directory = frontend`, env `VITE_API_BASE=https://padhai-api.onrender.com`).
- Alternative backend on **Vercel** (`Root Directory = backend`) uses the already-added `backend/api/index.py:1` + `backend/vercel.json:1` entry; same env plus `DATABASE_URL=postgresql+psycopg://…` (Neon/Supabase).

## 12) Success Metrics & Roadmap

**Metrics the jury cares about (targets from `design.md`):** recommendation relevance `70%+`, path completion within timeline `50%+`, NPS `40+`, goal achievement `%`, engagement `sessions/week`.

**What exists today (MVP → Enhanced done):** goal input, profiling, 3–5 → full ordered path, rule + AI explanations, dashboard, feedback loop, what-if, mentor. All `FRONTEND_REBUILD_AUDIT.md` routes/components are live against the real backend (no fakes).

**Roadmap:**
- Phase 2: streaks, richer gap analytics, shareable path links/PDF.
- Phase 3: adaptive real-time re-plan, predictive completion, career/job-market wiring, 3D path graph (`React Three Fiber`), collaborative paths, certification bridges.

## 13) Constraints, Risks & Ethical Notes

- **No auth yet** — `learner_id` is client-generated (Zustand+localStorage) and trusted; add auth before production.
- **Free-tier SQLite** is ephemeral; demo data reseeds on restart (fine for hackathon, not prod).
- **Privacy:** Groq key never hits the browser (`backend/.env` only); no learner data leaves the path except via Groq when configured — heuristic templates are the offline fallback.
- **No fabricated evidence** — only render `evidence` returned by the API; `FRONTEND_REBUILD_AUDIT.md:56` and `backend/app/ml/evidence_engine.py` are explicit.

## 14) Suggested Speaker Notes (paste into PPT notes)

- **Slide 2 (Problem):** “Every learner faces the same wall — too many courses, no map.”
- **Slide 4 (Pipeline):** “We don’t recommend — we sequence. Foundations first, always.”
- **Slide 6 (Evidence):** “This is the difference — every recommendation cites the sentence only *that* course owns.”
- **Slide 7 (Demo):** Live-click Landing → Onboarding step 6 (show detected skills) → Path → Explain (show review quote).
- **Slide 10 (Adapt):** “Plans must survive reality — 10h becomes 3h, we keep the core.”
- **Slide 13 (Close):** “PadhAI ko batao kya banna hai — we’ll build the raasta.”

---

## 15) Prompt to feed alongside this file

> You are a senior hackathon pitch designer. Build a 13-slide deck using the Volcanic Ash tokens (violet #8338EC / orange #FB5607 / green #3DDC84 / canvas #111214, Space Grotesk + Inter + IBM Plex Mono) from `frontend/src/index.css`. Treat `info.md` as the only truth about PadhAI. Follow the slide outline in §0 exactly, keep copy Hinglish-crisp, use hairline borders and flat solid cards, and generate both `pptx` + `pdf`. If you screenshot/mock, base them on the listed `.tsx` files — do not invent features or colors not in this brief.

---

*Generated for PadhAI (HCL PathFinder). Last synced `2026-08-26` from `README.md`, `backend/README.md`, `design.md`, `FRONTEND_REBUILD_AUDIT.md`, `frontend/src/pages/*`, `backend/app/ml/evidence_engine.py`, `Model/solution.py`.*
