# FRONTEND_REBUILD_AUDIT

> Pre-rebuild audit for the Astrolabe frontend. The old SPA is deleted and
> rebuilt from a clean foundation that consumes the **real, unchanged backend**
> (FastAPI "Astrolabe API" v1.0.0). This document is reference material only.

## Current frontend framework
- React 18 + Vite 5 + TypeScript (strict-ish).
- Styling: Tailwind CSS **v3** (not v4) + a hand-written design-system stylesheet (`src/index.css`).
- Data/state: `@tanstack/react-query` v5 (server) + `zustand` v4 (UI/learner state).
- Animation: `framer-motion` v11 (wrapped in `MotionConfig reducedMotion="user"`).
- Charts: `recharts` v2. Icons: `lucide-react`. Routing: `react-router-dom` v6.
- Fonts: Inter (sans/display) + IBM Plex Mono (evidence/data), loaded via Google Fonts in `index.html`.

## Current frontend root
- `frontend/` (Vite project). Entry `index.html` -> `src/main.tsx` -> `src/App.tsx`.

## Current routes (App.tsx)
- `/` Landing, `/onboarding`, `/profile` (ProfileSetup), `/analyzing`, `/path`
- AppShell group: `/dashboard`, `/skills`, `/courses`, `/projects`, `/mentor`
- `*` -> redirect to `/`.
- Routes are shallow; most pages fetch ad-hoc via `lib/api.ts`.

## Current components
- `components/AppShell.tsx`, `components/LearningPath.tsx`, `components/ResourceCard.tsx`, `components/ui.tsx`
- `ui.tsx` mixes primitives (EvidencePanel, SpotlightCard, Badge, Button) with page-specific widgets — violates the "UI primitives vs product components" split.

## Current CSS architecture
- Two layers: Tailwind utilities + `src/index.css` design system (CSS variables, light/dark via `.dark` / `[data-theme]`).
- Token mapping lives in `tailwind.config.js` (`bg`, `surface`, `elevated`, `border`, `primary/secondary/muted`, `accent`=purple, `signal`=orange, plus `route`/`signature` gradients).
- The design system already matches the new brief (Volcanic Ash == Astrolabe palette: purple `#8338EC`, orange `#FB5607`, ink `#0B0A10` background). It is **reused and refined**, not discarded.

## Current API integration
- `lib/api.ts`: thin fetch wrappers. Pattern is consistent but scattered in one file with no react-query hooks layer; pages call fetch directly and manage loading/error locally.
- Base URL: relative `/api/...` (Vite dev proxy / same-origin in prod). CORS on backend: `allow_credentials=True`, methods/headers `*`.

## Current theme implementation
- `index.css` tokens + `.dark` class on `<html>` (set in `index.html`).
- No dedicated theme store; theme toggling was only partial. New build adds a `zustand` theme store + `data-theme` attribute and a toggle in the shell.

## Existing useful assets (KEEP)
- `src/index.css` — full token/design system; refined to add explicit `card`/`elevated` tokens and purple/orange scales.
- `tailwind.config.js` — token mapping; extended with `card`/`elevated` + purple/orange scales + radius steps.
- `index.html` — fonts + root; keep (drop the unused liquid-glass SVG filter, not referenced by new components).
- `package.json`, `vite.config.ts`, `tsconfig*.json`, `postcss.config.js` — build config; keep.
- `src/vite-env.d.ts` — keep.

## Files safe to delete (old presentation architecture)
- `src/App.tsx`, `src/main.tsx` — rewritten.
- `src/components/*` — `AppShell.tsx`, `LearningPath.tsx`, `ResourceCard.tsx`, `ui.tsx`.
- `src/pages/*` — `Landing`, `Onboarding`, `ProfileSetup`, `Analyzing`, `Path`, `Dashboard`, `Skills`, `Courses`, `Projects`, `Mentor`.
- `src/lib/api.ts`, `src/lib/store.ts`, `src/lib/types.ts` — replaced by new typed API layer + stores + types.

## Files that must remain (backend untouched)
- Everything under `backend/` is the source of truth. **Do not modify** `main.py`, `config.py`, `database.py`, `models/`, `ml/`, `services/`, `api/`, `schemas/`, `seed.py`, `Model/`, `Data/`, backend tests.
- No fake evidence / courses / progress / reviews. Only render data returned by the API.

## New architecture
```
frontend/
  index.html                      (fonts, theme bootstrap)
  src/
    main.tsx                      (providers: QueryClient, Router, Theme init)
    App.tsx                       (routes)
    index.css                     (DESIGN TOKENS -> THEMES -> base styles)
    lib/
      types.ts                    (TS mirror of backend schemas)
      api.ts                      (typed client: grouped by domain)
      hooks.ts                    (react-query hooks)
    store/
      useLearner.ts               (learner_id, profile, theme)
    components/
      ui.tsx                      (Button, Input, Textarea, Select, Badge,
                                    Card, Progress, Skeleton, EmptyState,
                                    ErrorState, PageHeader, SectionHeader, Tabs,
                                    Tooltip, Spinner, Toast)
      shell.tsx                   (AppShell, NavRail, TopBar, ThemeToggle)
      product.paths.tsx           (LearningPath, LearningStep, StepStates)
      product.cards.tsx           (ResourceCard, RecommendationCard,
                                    EvidenceCard, SkillGapCard)
      product.panels.tsx          (ProgressOverview, SimulationComparison,
                                    FeedbackControl, MentorMessage, SkillGapList)
    pages/
      Landing, Onboarding, GoalAnalysis, Dashboard, SkillGap,
      Recommendations, LearningPath, StepDetail, Progress,
      Simulation, Mentor, Profile
```

## Migration strategy
1. **Audit** (this doc) + Git checkpoint of current state (cache artifact excluded).
2. **Delete** old `src` presentation files; keep `index.css`/config as the foundation.
3. **Design tokens**: refine `index.css` to expose `card`/`elevated` + purple/orange scales; extend `tailwind.config.js`.
4. **Types**: `lib/types.ts` mirrors `backend/app/schemas/__init__.py` exactly.
5. **API layer**: typed client + react-query hooks for every endpoint.
6. **Stores**: `useLearner` holds `learner_id` (created via `POST /api/profile`), persisted to localStorage; theme state.
7. **Shell**: quiet left nav (Dashboard, Learning Path, Recommendations, Progress, Mentor, Profile) + top bar with theme toggle + learner context.
8. **Product flows** built page-by-page in the brief's PHASE order, each consuming real endpoints.
9. **Theming**: every component uses semantic tokens; light + dark verified.
10. **Responsive/AA**: mobile nav, no horizontal overflow, focus states, reduced motion.
11. **QA**: `npm run build`, `npm run lint` (if configured), `tsc`, backend `pytest`; manual flow test via `npm run dev` + `uvicorn`.

## Backend API contract (verified from source)
Base: `/api/...` (no global prefix). No auth. CORS credentials allowed.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/api/health` | — | `{status, version, groq_configured, database, resources, model_ready}` |
| POST | `/api/goals/analyze` | `{goal}` | `GoalAnalysisResponse{goal,domain,target_role,timeline_months?,objectives[],detected_skills[],missing_information[],summary}` |
| POST | `/api/profile` | `ProfileCreate{learner_id?,name,goal,target_role,timeline_months,interests[],experience_level,current_skills{dict},completed_courses[],objectives[],study_time_per_week,preferred_format,preferred_pace,difficulty_preference,learning_history[]}` | `ProfileResponse{learner_id,...}` |
| GET | `/api/profile/{learner_id}` | — | `ProfileResponse` |
| GET | `/api/dashboard/{learner_id}` | — | `DashboardResponse{goal,target_role,timeline_months,study_time_per_week,interests[],path_id?,path_complete_pct,skills_covered,streak_days,hours_this_week,continue_resource?,continue_pct,continue_remaining_hours,next_actions[],skills[{skill,level,required,gap,domain}],priority_gaps[{skill,gap,current_level}],recent_feedback[]}` |
| GET | `/api/recommendations/{learner_id}` | — | `RecommendationsResponse{learner_id,recommendations[RecommendationOut]}` |
| POST | `/api/paths/generate` | `{learner_id}` | `PathGenerateResponse{path_id,learner_id,goal,target_role,timeline_months,study_time_per_week,prerequisite_coverage_pct,steps[LearningStepOut]}` |
| GET | `/api/paths/{path_id}` | — | `PathOut{...,steps[LearningStepOut]}` |
| POST | `/api/paths/{path_id}/adapt` | — | `PathGenerateResponse` |
| POST | `/api/paths/simulate` | `{learner_id,changes{study_time_per_week?,experience_level?,preferred_pace?,difficulty_preference?,add_interest?}}` | `SimulateResponse{current{},simulated{},changes_summary[],steps[LearningStepOut]}` |
| GET | `/api/paths/{path_id}/steps/{step_id}/explain` | — | `MentorResponse{message,sources[],evidence?}` |
| POST | `/api/progress` | `{learner_id,resource_id,completion_percentage,status?,time_spent_hours}` | `ProgressResponse{learner_id,resource_id,completion_percentage,status,next_action?,path_complete_pct}` |
| GET | `/api/progress/{learner_id}` | — | `{learner_id,progress[{resource_id,completion_percentage,status,time_spent_hours}]}` |
| POST | `/api/feedback` | `{learner_id,resource_id,helpful,reason?}` | `FeedbackResponse{id,adaptation,learner_id}` |
| POST | `/api/mentor/chat` | `{learner_id,message}` | `MentorResponse{message,sources[],evidence?}` |
| GET | `/api/mentor/history/{learner_id}` | — | `MentorHistoryItem[]{role,message,sources[]}` |

Shared shapes:
- `ResourceOut{id,title,type,domain,difficulty,duration_hours,format,description,skills_gained[],prerequisites[],phase,optional,rating}`
- `Evidence{course_signatures[],matched_signatures[],similarity,peer_courses[],source}`
- `RecommendationOut{resource,evidence?,model_relevance,skill_gap_match,interest_match,prerequisite_fit,difficulty_fit,time_fit,evidence_score,match_score,reason}`
- `LearningStepOut{id,resource_id,order,phase,status,completion_percentage,estimated_hours,milestone,recommendation_score,reason,prerequisites[],skills_gained[],resource,unlocks[],evidence?}`
- Step `status` values: `completed | current | recommended | locked | optional`.

Notes:
- A `learner_id` must exist (via `POST /api/profile`) before dashboard/recommendations/paths work (404 otherwise).
- `simulate` and `paths/explain` return `LearningStepOut` with `evidence` populated from the Evidence Engine — render verbatim, never fabricate.
- Mentor `sources` is a list of arbitrary dicts (references); render as chips/links.
- There is **no** dedicated skill-gap endpoint; Skill Gap UI is built from `GET /api/dashboard/{id}.skills` + `priority_gaps`.
