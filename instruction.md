# Pathwise --- Complete Frontend + Backend Build Instruction

## AI-Powered Personalized Learning Path Recommender

> **Product promise:** Tell Pathwise where you want to go. It
> understands where you are, identifies what you are missing, builds the
> route between the two, explains every important recommendation, and
> adapts the route as you learn.

------------------------------------------------------------------------

# 0. EXECUTION RULES

You are a senior full-stack engineer, ML engineer, product designer, and
UI engineer.

Build this project as a **real working prototype**, not a collection of
static mockups.

## Mandatory rules

-   [ ] Inspect the existing repository before changing anything.
-   [ ] Read `design.md`, `SKILLS.md`, `solution.py`, package files,
    environment files, and existing source code.
-   [ ] Preserve working code unless there is a clear reason to change
    it.
-   [ ] Do not rewrite `solution.py` without first understanding it.
-   [ ] Integrate the existing ML model through a clean adapter/service.
-   [ ] Do not hardcode separate fake frontend screens that are
    disconnected.
-   [ ] Frontend state must flow through the backend/API.
-   [ ] Use Groq only through the backend.
-   [ ] Never expose `GROQ_API_KEY` in frontend/browser code.
-   [ ] Use environment variables for secrets.
-   [ ] Build the core product flow before adding visual effects.
-   [ ] Do not add technologies merely because they are available.
-   [ ] Do not create fake AI outputs that contradict actual application
    data.
-   [ ] Do not invent model confidence if the model does not provide
    confidence.
-   [ ] Every major feature must have a clear purpose in solving the
    problem statement.
-   [ ] Keep the application runnable after every major phase.
-   [ ] Update this checklist as work progresses.

------------------------------------------------------------------------

# 1. PROBLEM TO SOLVE

Build an AI-powered personalized learning assistant that:

1.  Understands a learner's natural-language goal.
2.  Builds a learner profile.
3.  Understands current skills and learning history.
4.  Identifies skill gaps.
5.  Recommends courses, projects, assessments, and resources.
6.  Orders recommendations according to prerequisites.
7.  Generates a personalized learning roadmap.
8.  Explains why recommendations were made.
9.  Tracks progress.
10. Collects learner feedback.
11. Adapts future recommendations.
12. Gives the learner a clear next action.

The solution must demonstrate that personalization is based on the
learner's actual state rather than simply returning a generic course
list.

------------------------------------------------------------------------

# 2. CORE PRODUCT IDEA

The product is not:

> "A website that recommends courses."

The product is:

> "An intelligent system that understands a learner's current state,
> understands their destination, calculates the gap, creates the route,
> explains the route, and continuously adjusts that route."

The core pipeline is:

``` text
Learner Goal
    ↓
Goal Understanding
    ↓
Learner Profile
    ↓
Skill Gap Analysis
    ↓
Existing ML Model (`solution.py`)
    ↓
Recommendation Ranking
    ↓
Prerequisite Validation
    ↓
Learning Path Generator
    ↓
Milestones
    ↓
Explanation
    ↓
Dashboard
    ↓
Progress
    ↓
Feedback
    ↓
Adaptive Recommendations
```

------------------------------------------------------------------------

# 3. TECHNOLOGY STACK

Use the existing project stack where possible.

## Frontend

Preferred:

-   [ ] React
-   [ ] TypeScript
-   [ ] Vite or the existing frontend framework
-   [ ] Tailwind CSS
-   [ ] shadcn/ui only where useful
-   [ ] Lucide icons
-   [ ] React Query / TanStack Query for server state
-   [ ] Zustand or existing state solution for lightweight client state
-   [ ] Framer Motion or GSAP for meaningful motion
-   [ ] Recharts only where a chart genuinely improves understanding

## Backend

Preferred:

-   [ ] Python
-   [ ] FastAPI
-   [ ] Pydantic
-   [ ] Existing `solution.py`
-   [ ] Existing ML dependencies
-   [ ] SQLAlchemy if persistence is required
-   [ ] SQLite for the fastest local MVP if PostgreSQL is not already
    configured
-   [ ] PostgreSQL/Supabase if the project already uses it

## AI

Use:

-   [ ] Groq API
-   [ ] Groq for natural-language understanding, explanations, and
    mentor interactions
-   [ ] Existing ML model for recommendation/ranking where applicable

Do not use Groq as a replacement for the existing recommendation model.

------------------------------------------------------------------------

# 4. GROQ ARCHITECTURE

Groq must be called from the backend.

Correct:

``` text
Browser
   ↓
FastAPI
   ↓
Groq
```

Incorrect:

``` text
Browser
   ↓
GROQ_API_KEY
   ↓
Groq
```

Never put the Groq secret in:

-   React source
-   Vite `VITE_*` variables
-   client-side JavaScript
-   localStorage
-   browser network payloads
-   Git commits

Use:

``` env
GROQ_API_KEY=your_key_here
GROQ_MODEL=your_selected_model
```

Store this only in the backend environment.

Add `.env` to `.gitignore`.

Create `.env.example`:

``` env
GROQ_API_KEY=
GROQ_MODEL=
DATABASE_URL=
FRONTEND_URL=http://localhost:5173
```

Groq's official documentation recommends environment variables for API
keys and explicitly warns against exposing keys in frontend bundles. It
also provides an OpenAI-compatible API base URL. Use the official Groq
SDK or the OpenAI-compatible client according to the existing backend
architecture.

------------------------------------------------------------------------

# 5. GROQ RESPONSIBILITIES

Use Groq for tasks where language understanding is useful.

## Groq should handle

-   [ ] Natural-language goal parsing
-   [ ] Clarifying questions
-   [ ] Learner-facing recommendation explanations
-   [ ] AI Mentor conversations
-   [ ] Summarizing learner state
-   [ ] Converting free-form feedback into structured categories
-   [ ] Optional generation of learning objectives

## Groq should NOT be the sole source of truth for

-   [ ] Course prerequisites
-   [ ] Course metadata
-   [ ] Skill scores
-   [ ] Progress
-   [ ] Completion status
-   [ ] Recommendation ranking when the ML model is intended to rank
    resources
-   [ ] Database state

The backend must ground Groq responses in structured application data.

------------------------------------------------------------------------

# 6. EXISTING `solution.py`

Before implementing the recommendation backend:

-   [ ] Open `solution.py`.
-   [ ] Understand every public function/class.
-   [ ] Identify model type.
-   [ ] Identify preprocessing.
-   [ ] Identify required features.
-   [ ] Identify training vs inference code.
-   [ ] Identify model artifacts.
-   [ ] Identify expected input format.
-   [ ] Identify prediction/output format.
-   [ ] Run the existing model with a valid sample.
-   [ ] Record the actual output.
-   [ ] Confirm how inference should be called.

Do not guess the interface.

Create:

``` text
backend/app/ml/ml_adapter.py
```

The adapter should isolate the rest of the backend from model-specific
details.

Example conceptual interface:

``` python
class RecommendationModel:
    def recommend(self, learner_profile, candidates):
        ...
```

Adapt this to the actual `solution.py` implementation.

------------------------------------------------------------------------

# 7. FULL APPLICATION FLOW

The main flow must be:

``` text
Landing
   ↓
Goal Input
   ↓
Goal Analysis
   ↓
Profile Questions
   ↓
Profile Confirmation
   ↓
Skill Analysis
   ↓
Generating Path
   ↓
Personalized Path
   ↓
Dashboard
   ↓
Learning
   ↓
Progress Update
   ↓
Feedback
   ↓
Path Adaptation
```

The user must be able to complete this entire flow in a demo.

------------------------------------------------------------------------

# 8. PAGE 1 --- LANDING `/`

## Purpose

Introduce Pathwise and start the personalization journey.

## Header

``` text
Pathwise

How it works
My path

Sign in

[ Build my path → ]
```

Keep navigation minimal.

## Hero

Headline:

``` text
Your goal.
Your learning path.
```

Supporting copy:

``` text
Tell Pathwise what you want to achieve.
We'll figure out what you need to learn next.
```

Primary CTA:

``` text
Build my learning path →
```

Secondary:

``` text
See how it works
```

## Hero visual

Do not use a robot.

Use the learning-path concept:

``` text
Current Skills
    │
    ├── Python ✓
    ├── SQL ✓
    │
    ▼
Statistics
    │
    ▼
Machine Learning
    │
    ▼
Deep Learning
    │
    ▼
Generative AI
    │
    ▼
AI / ML Engineer
```

The visual should feel like a route from current state to target state.

------------------------------------------------------------------------

# 9. LANDING SECTIONS

Build only meaningful sections.

-   [ ] Hero
-   [ ] How it works
-   [ ] Personalization example
-   [ ] Skill-gap example
-   [ ] Adaptive learning example
-   [ ] AI Mentor example
-   [ ] Final CTA

Do not create a generic 15-section SaaS landing page.

------------------------------------------------------------------------

# 10. PAGE 2 --- GOAL ONBOARDING `/onboarding`

## Purpose

Capture the user's goal in natural language.

Headline:

``` text
Where do you want to go?
```

Description:

``` text
Tell me what you're trying to achieve.
You don't need to know what to learn yet.
```

Large conversational input:

``` text
I want to become an AI/ML engineer within
8 months and build projects that will help
me get a job.
```

Button:

``` text
Build my path →
```

Example goals:

-   Become a frontend developer in 6 months
-   Prepare for a data science role
-   Learn GenAI from scratch
-   Build a machine learning portfolio
-   Prepare for a cloud certification

Clicking an example should populate the input.

------------------------------------------------------------------------

# 11. GOAL ANALYSIS

After submission:

``` text
POST /api/goals/analyze
```

The backend should extract:

``` text
goal
domain
target role
timeline
objectives
detected skills
missing information
```

Example:

``` json
{
  "goal": "Become an AI/ML Engineer",
  "domain": "AI/ML",
  "target_role": "AI/ML Engineer",
  "timeline_months": 8,
  "objectives": ["job preparation", "portfolio"],
  "detected_skills": ["Python"],
  "missing_information": ["weekly study time", "experience level"]
}
```

Use Groq for natural-language parsing when necessary.

Validate the result using Pydantic.

------------------------------------------------------------------------

# 12. PROFILE CONVERSATION

Do not show a giant form.

Ask only the information needed to personalize the path.

Example:

``` text
How comfortable are you with Python?

○ Just getting started
○ Comfortable with basics
● Can build projects
○ Advanced
```

Then:

``` text
How much time can you study each week?

○ < 3 hours
○ 3–6 hours
● 6–10 hours
○ 10+ hours
```

Then:

``` text
What is your primary outcome?

○ Get a job
○ Build projects
○ Academic learning
○ Certification
○ Explore the field
```

------------------------------------------------------------------------

# 13. PROFILE MODEL

Create a structured learner profile.

Minimum fields:

``` text
learner_id
name
goal
target_role
timeline
interests
experience_level
current_skills
completed_courses
objectives
study_time_per_week
preferred_format
preferred_pace
difficulty_preference
learning_history
```

------------------------------------------------------------------------

# 14. PROFILE CONFIRMATION

Before generating the path, show:

``` text
Here's what I understand about you.

Goal
AI / ML Engineer

Timeline
8 months

Study time
6 hrs/week

Experience
Intermediate

Interests
Machine Learning
GenAI
LLMs

Strengths
Python
SQL

Priority gaps
Statistics
Machine Learning
Deep Learning
```

Actions:

``` text
[ Generate my learning path → ]
[ Edit profile ]
```

------------------------------------------------------------------------

# 15. PAGE 3 --- ANALYSIS `/analyzing`

Show a meaningful generation sequence.

``` text
Understanding your goal       ✓
Analyzing your skills        ✓
Finding skill gaps           ✓
Mapping prerequisites        ✓
Ranking learning resources   ✓
Building your learning path  ...
```

These statuses should correspond to actual backend stages where
possible.

Do not fake technical operations.

------------------------------------------------------------------------

# 16. RECOMMENDATION PIPELINE

Backend pipeline:

``` text
Learner Profile
     ↓
Goal Requirements
     ↓
Skill Gap Analysis
     ↓
Candidate Resources
     ↓
Existing `solution.py`
     ↓
Model Ranking
     ↓
Hard Constraints
     ↓
Final Recommendations
```

Hard constraints include:

-   [ ] Completed resources should not be recommended as new learning
    unless intentionally reviewed.
-   [ ] Prerequisites must be satisfied or inserted earlier.
-   [ ] Difficulty should fit the learner.
-   [ ] Resource duration should fit available time.
-   [ ] Recommendations should align with the learner's goal.
-   [ ] Learner feedback should influence future recommendations.

------------------------------------------------------------------------

# 17. PAGE 4 --- PERSONALIZED PATH `/path`

This is the signature page.

Header:

``` text
Your personalized path

AI / ML Engineer
8 months · 6 hrs/week

42% of prerequisite skills already covered
```

Main route:

``` text
START
  ↓
Python Fundamentals ✓
  ↓
Statistics for ML
  ↓
Machine Learning
  ↓
Model Evaluation
  ↓
Deep Learning
  ↓
Generative AI
  ↓
RAG Applications
  ↓
Portfolio Project
  ↓
AI / ML Engineer
```

Use connected nodes, not just cards.

------------------------------------------------------------------------

# 18. PATH PHASES

Group the path into meaningful phases.

## Phase 1 --- Foundations

-   Statistics
-   Python for ML
-   Data preparation

## Phase 2 --- Machine Learning

-   Supervised learning
-   Unsupervised learning
-   Model evaluation
-   Feature engineering

## Phase 3 --- Deep Learning

-   Neural networks
-   CNNs
-   Transformers

## Phase 4 --- Generative AI

-   LLMs
-   Embeddings
-   RAG
-   Agentic AI

## Phase 5 --- Portfolio

-   ML project
-   GenAI project
-   Deployment
-   Portfolio

The exact path must come from the recommendation/resource data rather
than being permanently hardcoded.

------------------------------------------------------------------------

# 19. PATH NODE DETAILS

Each node should contain:

``` text
title
type
status
difficulty
estimated_hours
skills_gained
prerequisites
recommendation_score
reason
```

Statuses:

``` text
completed
current
recommended
locked
optional
```

------------------------------------------------------------------------

# 20. "WHY THIS?" EXPERIENCE

When the learner clicks a recommendation:

Open a side panel.

Title:

``` text
Why is this next?
```

Example:

``` text
You already have strong Python fundamentals.

Your profile shows a significant gap in
statistics and model evaluation.

This module closes that gap before you
move into Machine Learning.

This unlocks:

• Model Evaluation
• Feature Engineering
• Machine Learning
```

The explanation must use structured recommendation data.

Groq can turn the structured facts into natural language, but must not
invent facts.

------------------------------------------------------------------------

# 21. RECOMMENDATION SCORE

If the existing model returns a score, preserve it.

If it does not, calculate transparent component scores.

Possible components:

``` text
model relevance
skill gap match
interest match
prerequisite fit
difficulty fit
time fit
```

Never label a deterministic heuristic as "AI confidence."

Use labels such as:

``` text
Match
Relevance
Fit
```

unless the actual model provides calibrated confidence.

------------------------------------------------------------------------

# 22. COURSE CARDS

Each course:

``` text
Course title
Course type
Difficulty
Duration
Format
Skills
Prerequisites
Why recommended
[ Start course ]
```

Use realistic learning content.

Examples:

-   Statistics for Machine Learning
-   Machine Learning Fundamentals
-   Feature Engineering
-   Model Evaluation
-   Deep Learning Fundamentals
-   LLM Application Development
-   Retrieval-Augmented Generation
-   Model Deployment

------------------------------------------------------------------------

# 23. PROJECT CARDS

Projects must be connected to the learning path.

Example:

``` text
Customer Churn Predictor

Intermediate
12–15 hours

Skills:
Python
Pandas
Scikit-learn
Model Evaluation

Why:
Apply the ML concepts you just learned
and create a portfolio-ready artifact.
```

------------------------------------------------------------------------

# 24. PAGE 5 --- DASHBOARD `/dashboard`

The dashboard is the ongoing home.

Sidebar:

``` text
Overview
My Path
Skills
Courses
Projects

AI Mentor

Settings
```

Header:

``` text
Good evening, Satyam.

You're working toward
AI / ML Engineer.
```

------------------------------------------------------------------------

# 25. DASHBOARD METRICS

Show only useful metrics:

``` text
42%
Path complete

7 / 18
Skills covered

12 days
Learning streak

6.2 hrs
This week
```

Do not create statistics that the backend does not actually track.

------------------------------------------------------------------------

# 26. CONTINUE LEARNING

This must be the most prominent dashboard action.

``` text
Continue your path

Statistics for Machine Learning

72% complete

2h 10m remaining

[ Continue learning → ]
```

The dashboard must answer:

> What should I do right now?

------------------------------------------------------------------------

# 27. NEXT ACTIONS

Generate 3--5 context-aware actions.

Examples:

``` text
Continue Statistics
Complete probability assessment
Review model evaluation
Start ML fundamentals
Build churn prediction project
```

These should be generated from current progress and future path state.

------------------------------------------------------------------------

# 28. PAGE 6 --- SKILLS `/skills`

Display:

``` text
Python             88%
SQL                68%
Statistics         49%
Machine Learning   31%
Deep Learning      12%
GenAI               8%
```

Then:

``` text
Priority gaps

01 Statistics
02 Model Evaluation
03 Machine Learning
04 Deep Learning
```

Show how each gap connects to the path.

------------------------------------------------------------------------

# 29. PAGE 7 --- COURSES `/courses`

Tabs:

``` text
Recommended
In progress
Completed
Saved
```

Filters:

``` text
Domain
Difficulty
Duration
Format
Status
```

Recommendations must come from the backend.

------------------------------------------------------------------------

# 30. PAGE 8 --- PROJECTS `/projects`

Show portfolio-oriented projects connected to skills and milestones.

Each project should explain:

``` text
Why this project?
What skills does it build?
Where does it fit in the path?
How difficult is it?
How long will it take?
```

------------------------------------------------------------------------

# 31. PAGE 9 --- AI MENTOR `/mentor`

The AI Mentor is not a generic chatbot.

It must know:

``` text
learner profile
goal
current path
current step
skill gaps
completed learning
progress
recommendations
feedback
```

Supported questions:

``` text
Why is this course next?
Can I skip this?
What should I learn today?
What should I focus on this week?
How does this project help my career?
Am I on track?
What should I learn before this?
```

------------------------------------------------------------------------

# 32. MENTOR API

Create:

``` http
POST /api/mentor/chat
```

Request:

``` json
{
  "learner_id": "learner_001",
  "message": "Why is statistics before machine learning?"
}
```

Backend should gather relevant learner context and send only necessary
structured information to Groq.

Return:

``` json
{
  "message": "...",
  "sources": [
    {
      "type": "path_step",
      "id": "..."
    }
  ]
}
```

Do not expose private backend internals.

------------------------------------------------------------------------

# 33. FEEDBACK

Every recommendation should support:

``` text
Helpful
Not useful
```

If not useful:

``` text
Too difficult
Already know this
Not interested
Too long
Not relevant
Other
```

Store feedback.

------------------------------------------------------------------------

# 34. FEEDBACK → ADAPTATION

Feedback must affect future recommendations.

Example:

``` text
User:
Too difficult
```

System:

``` text
↓
Reduce difficulty
↓
Find prerequisite material
↓
Adjust recommendation
↓
Update future path
```

Another:

``` text
User:
Already know this
```

System:

``` text
↓
Increase estimated skill
↓
Skip redundant content
↓
Move learner forward
```

------------------------------------------------------------------------

# 35. PROGRESS

Create:

``` http
POST /api/progress
```

Input:

``` json
{
  "learner_id": "learner_001",
  "resource_id": "course_stats",
  "completion_percentage": 100,
  "status": "completed",
  "time_spent_hours": 19
}
```

Progress should update:

-   [ ] completed resources
-   [ ] skill state
-   [ ] path progress
-   [ ] milestone state
-   [ ] next actions
-   [ ] recommendation context

------------------------------------------------------------------------

# 36. WHAT-IF SIMULATION

Create:

``` http
POST /api/path/simulate
```

Example:

``` json
{
  "learner_id": "learner_001",
  "changes": {
    "study_time_per_week": 3
  }
}
```

Return a simulated path.

Do not modify the actual learner profile.

Example:

``` text
Current
8 months · 6 hrs/week

Simulation
11 months · 3 hrs/week

Changes:
• Optional modules removed
• Weekly workload reduced
• Portfolio milestone moved
• Core prerequisites preserved
```

This feature is one of the strongest ways to demonstrate adaptive
personalization.

------------------------------------------------------------------------

# 37. BACKEND API STRUCTURE

Create:

``` text
/api/goals/analyze
/api/profile
/api/profile/{learner_id}

/api/recommendations
/api/recommendations/{learner_id}

/api/paths/generate
/api/paths/{path_id}
/api/paths/{path_id}/adapt
/api/paths/simulate

/api/progress
/api/progress/{learner_id}

/api/feedback

/api/mentor/chat

/api/dashboard/{learner_id}

/api/health
```

Use versioning if appropriate:

``` text
/api/v1/...
```

------------------------------------------------------------------------

# 38. BACKEND PROJECT STRUCTURE

Preferred:

``` text
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   │
│   ├── api/
│   │   ├── goals.py
│   │   ├── profiles.py
│   │   ├── recommendations.py
│   │   ├── paths.py
│   │   ├── progress.py
│   │   ├── feedback.py
│   │   ├── mentor.py
│   │   └── dashboard.py
│   │
│   ├── services/
│   │   ├── goal_service.py
│   │   ├── profile_service.py
│   │   ├── skill_gap_service.py
│   │   ├── recommendation_service.py
│   │   ├── path_generator.py
│   │   ├── explanation_service.py
│   │   ├── progress_service.py
│   │   ├── adaptive_service.py
│   │   └── groq_service.py
│   │
│   ├── ml/
│   │   └── ml_adapter.py
│   │
│   ├── schemas/
│   ├── models/
│   ├── repositories/
│   └── core/
│
├── solution.py
├── data/
├── tests/
├── requirements.txt
├── .env.example
└── README.md
```

Adapt to the existing repository instead of blindly moving files.

------------------------------------------------------------------------

# 39. DATABASE

Minimum entities:

``` text
learners
learner_skills
courses
course_prerequisites
learning_paths
learning_steps
progress
recommendations
feedback
milestones
conversations
```

Minimum relationships:

``` text
Learner
  ├── Skills
  ├── Progress
  ├── Feedback
  ├── Paths
  └── Conversations

Course
  ├── Skills
  └── Prerequisites

LearningPath
  └── LearningSteps

LearningStep
  └── Resource/Course/Project
```

------------------------------------------------------------------------

# 40. SEED DATA

Create a realistic seed dataset.

Minimum domains:

-   [ ] Python
-   [ ] SQL
-   [ ] Statistics
-   [ ] Data Analysis
-   [ ] Machine Learning
-   [ ] Deep Learning
-   [ ] NLP
-   [ ] Generative AI
-   [ ] LLMs
-   [ ] RAG
-   [ ] Deployment
-   [ ] Portfolio

Include:

-   [ ] Courses
-   [ ] Projects
-   [ ] Assessments
-   [ ] Articles/resources

Include prerequisite relationships.

Example:

``` text
Python
  ↓
NumPy/Pandas
  ↓
Statistics
  ↓
Machine Learning
  ↓
Deep Learning
  ↓
LLMs
  ↓
RAG
```

------------------------------------------------------------------------

# 41. PREREQUISITE ENGINE

The path generator must not simply sort by recommendation score.

It must:

1.  Identify required target skills.
2.  Identify learner's current skills.
3.  Calculate gaps.
4.  Find resources addressing gaps.
5.  Resolve prerequisites.
6.  Remove already satisfied prerequisites.
7.  Create dependency graph.
8.  Topologically order resources.
9.  Apply recommendation ranking.
10. Insert projects and assessments.
11. Generate milestones.
12. Estimate timeline.

No learning path should contain a resource before an unsatisfied hard
prerequisite.

------------------------------------------------------------------------

# 42. GROQ PROMPTING

Use structured prompts.

The system prompt for goal parsing should enforce JSON output matching a
Pydantic schema.

The mentor prompt should include:

``` text
Learner goal
Current skills
Current path
Current step
Completed learning
Skill gaps
Relevant recommendation
User question
```

The mentor must:

-   [ ] Answer the actual question.
-   [ ] Use learner context.
-   [ ] Avoid inventing course metadata.
-   [ ] Avoid inventing progress.
-   [ ] Explain recommendations in simple language.
-   [ ] Recommend actions that exist in the learner's path when
    possible.
-   [ ] State when information is unavailable.

------------------------------------------------------------------------

# 43. API KEY SECURITY

Mandatory:

-   [ ] `GROQ_API_KEY` exists only on backend.
-   [ ] `.env` is gitignored.
-   [ ] `.env.example` contains blank placeholders.
-   [ ] No API key is hardcoded.
-   [ ] No API key is returned by an endpoint.
-   [ ] No API key appears in frontend environment variables.
-   [ ] No API key appears in logs.
-   [ ] No API key appears in screenshots or README.

If a key is accidentally exposed, stop and remove it before continuing.

------------------------------------------------------------------------

# 44. CORS

Frontend and backend may run on different local origins.

Configure FastAPI CORS with explicit development origins, for example:

``` text
http://localhost:5173
http://localhost:3000
```

Do not use unrestricted wildcard CORS in a credentialed production
configuration.

FastAPI's official documentation recommends explicitly specifying
allowed origins when credentials or authorization are involved.

------------------------------------------------------------------------

# 45. FRONTEND API CLIENT

Create a centralized API client.

Example:

``` text
src/lib/api/
├── client.ts
├── goals.ts
├── profile.ts
├── recommendations.ts
├── paths.ts
├── progress.ts
├── feedback.ts
├── mentor.ts
└── dashboard.ts
```

Do not scatter raw `fetch()` calls throughout components.

------------------------------------------------------------------------

# 46. FRONTEND STATE

Separate:

## Server state

Use React Query/TanStack Query for:

-   profile
-   path
-   recommendations
-   dashboard
-   progress
-   mentor requests

## Local UI state

Use local React state for:

-   modal open/close
-   selected path node
-   filters
-   input state
-   animation state

Use Zustand only where shared client state is genuinely needed.

------------------------------------------------------------------------

# 47. FRONTEND COMPONENTS

Create reusable components:

``` text
AppShell
Sidebar
Topbar
GoalComposer
ChatMessage
ProfileSummary
SkillBar
SkillGapCard
LearningPath
PathNode
PathConnector
MilestoneTimeline
CourseCard
ProjectCard
RecommendationCard
RecommendationReason
ProgressCard
MentorPanel
MentorSuggestion
WhatIfPanel
LoadingState
EmptyState
ErrorState
```

------------------------------------------------------------------------

# 48. DESIGN SYSTEM

Visual style:

``` text
Background       #09090B
Surface          #111114
Elevated         #18181C
Border           #27272A

Primary Text     #F4F4F5
Secondary Text   #A1A1AA
Muted            #71717A

Purple           #8B5CF6
Teal             #14B8A6
Green            #22C55E
Amber            #F59E0B
Red              #EF4444
Blue             #3B82F6
```

Use purple for brand/AI/action hierarchy.

Use teal for progress.

Do not make every element purple.

------------------------------------------------------------------------

# 49. ANTI-AI-GENERATED DESIGN RULES

Avoid:

-   [ ] Giant purple blobs
-   [ ] Excessive gradients
-   [ ] Glassmorphism everywhere
-   [ ] Robot illustrations
-   [ ] Floating AI brains
-   [ ] Random 3D shapes
-   [ ] Excessive glow
-   [ ] Excessive rounded cards
-   [ ] Every section being a card
-   [ ] Huge "AI-powered" labels
-   [ ] Fake statistics
-   [ ] Fake testimonials
-   [ ] Decorative charts
-   [ ] Unnecessary animations

The interface should feel like a real education product.

------------------------------------------------------------------------

# 50. SIGNATURE VISUAL

The learning path is the visual identity.

Use:

``` text
nodes
connections
milestones
progress
current state
future state
goal
```

The visual system should communicate:

``` text
Where am I?
What is next?
Why is it next?
What will it unlock?
How close am I to my goal?
```

------------------------------------------------------------------------

# 51. MOTION

Use motion for meaning.

Good:

-   [ ] Goal submission transition
-   [ ] Path generation sequence
-   [ ] Node selection
-   [ ] Progress updates
-   [ ] Milestone completion
-   [ ] Panel transitions
-   [ ] Button feedback

Avoid:

-   [ ] Infinite floating
-   [ ] Constant pulsing
-   [ ] Every element animating
-   [ ] Excessive parallax
-   [ ] Bouncy cards
-   [ ] Decorative particle systems

Respect `prefers-reduced-motion`.

------------------------------------------------------------------------

# 52. LOADING STATES

Do not use a generic spinner for everything.

Use contextual states:

``` text
Understanding your goal...
Analyzing your skills...
Finding skill gaps...
Mapping prerequisites...
Ranking resources...
Building your path...
```

Use skeletons for dashboard/resource loading.

------------------------------------------------------------------------

# 53. ERROR STATES

Use actionable errors.

Bad:

``` text
Something went wrong.
```

Good:

``` text
We couldn't build your learning path.

Your weekly study time is missing.

[ Complete profile ]
```

------------------------------------------------------------------------

# 54. EMPTY STATES

Example:

``` text
No projects yet.

Projects appear here as you progress
through your learning path.

[ View my path ]
```

Every empty state should explain what happens next.

------------------------------------------------------------------------

# 55. RESPONSIVE DESIGN

Desktop:

``` text
1440px+
```

Tablet:

``` text
768–1439px
```

Mobile:

``` text
<768px
```

Mobile adaptations:

-   [ ] Sidebar becomes drawer/bottom navigation.
-   [ ] Learning path becomes vertical.
-   [ ] Dashboard cards stack.
-   [ ] Mentor becomes bottom sheet.
-   [ ] Complex charts simplify.
-   [ ] Wide path visualizations can scroll horizontally when necessary.

Do not simply shrink desktop UI.

------------------------------------------------------------------------

# 56. ACCESSIBILITY

Mandatory:

-   [ ] Semantic HTML.
-   [ ] Keyboard navigation.
-   [ ] Visible focus states.
-   [ ] Accessible labels.
-   [ ] Sufficient contrast.
-   [ ] Screen-reader-friendly status.
-   [ ] Reduced-motion support.
-   [ ] Do not communicate state through color alone.

------------------------------------------------------------------------

# 57. PERFORMANCE

Do not add expensive technologies unnecessarily.

Lazy-load:

-   [ ] Heavy charts
-   [ ] Three.js/R3F if used
-   [ ] Large animation modules
-   [ ] Non-critical screens

Prefer:

-   [ ] CSS transforms
-   [ ] opacity animation
-   [ ] efficient list rendering
-   [ ] memoization where useful
-   [ ] cached server data

------------------------------------------------------------------------

# 58. TESTING CHECKLIST

## Backend

-   [ ] Health endpoint works.
-   [ ] Goal analysis works.
-   [ ] Profile creation works.
-   [ ] ML adapter works.
-   [ ] Recommendation endpoint works.
-   [ ] Prerequisites are respected.
-   [ ] Path generation works.
-   [ ] Progress works.
-   [ ] Feedback works.
-   [ ] Adaptation works.
-   [ ] What-if simulation does not mutate real data.
-   [ ] Mentor works.
-   [ ] Dashboard aggregation works.
-   [ ] Invalid input returns useful errors.

## Frontend

-   [ ] Landing works.
-   [ ] Goal input works.
-   [ ] Profile flow works.
-   [ ] Analysis screen works.
-   [ ] Path renders real API data.
-   [ ] Path node details work.
-   [ ] Dashboard uses real data.
-   [ ] Progress updates.
-   [ ] Feedback works.
-   [ ] Mentor works.
-   [ ] What-if works.
-   [ ] Mobile layout works.

------------------------------------------------------------------------

# 59. INTEGRATION CHECKLIST

Do not mark the project complete until this exact flow works:

-   [ ] User enters a goal.
-   [ ] Backend receives goal.
-   [ ] Groq parses goal.
-   [ ] Profile questions are generated/selected.
-   [ ] Learner profile is saved.
-   [ ] Skill gaps are calculated.
-   [ ] Existing `solution.py` is invoked.
-   [ ] Recommendations are generated.
-   [ ] Prerequisites are resolved.
-   [ ] Personalized path is generated.
-   [ ] Frontend renders the actual path.
-   [ ] User opens "Why this?"
-   [ ] Backend provides grounded explanation.
-   [ ] User completes a learning step.
-   [ ] Progress is stored.
-   [ ] Dashboard updates.
-   [ ] User submits negative feedback.
-   [ ] Recommendation context changes.
-   [ ] User runs a "What if?" simulation.
-   [ ] Simulated path changes without changing the real path.

------------------------------------------------------------------------

# 60. HCL DEMO CHECKLIST

The final demo should take approximately 3--5 minutes.

## Demo

-   [ ] Start on landing.
-   [ ] Enter: "I want to become an AI/ML engineer in 8 months."
-   [ ] Answer profile questions.
-   [ ] Generate path.
-   [ ] Show skill gaps.
-   [ ] Show personalized roadmap.
-   [ ] Click "Why is Statistics next?"
-   [ ] Show grounded explanation.
-   [ ] Open dashboard.
-   [ ] Show current progress.
-   [ ] Mark a resource complete.
-   [ ] Show updated next action.
-   [ ] Give feedback: "Too difficult."
-   [ ] Show adaptation.
-   [ ] Run "What if I only have 3 hours/week?"
-   [ ] Show changed timeline/path.

------------------------------------------------------------------------

# 61. WHAT THE JUDGES SHOULD UNDERSTAND

After the demo, the judge should be able to answer "yes" to:

-   [ ] Does it understand a natural-language goal?
-   [ ] Does it build a learner profile?
-   [ ] Does it use current skills?
-   [ ] Does it identify skill gaps?
-   [ ] Does it use an ML recommendation model?
-   [ ] Does it consider prerequisites?
-   [ ] Does it produce a sequence rather than a flat list?
-   [ ] Does it explain recommendations?
-   [ ] Does it track progress?
-   [ ] Does feedback change recommendations?
-   [ ] Does the system adapt?
-   [ ] Is the dashboard useful?
-   [ ] Is the product visually polished?

------------------------------------------------------------------------

# 62. IMPLEMENTATION PHASES

## PHASE 0 --- REPOSITORY AUDIT

-   [ ] Inspect all existing files.
-   [ ] Read `design.md`.
-   [ ] Read `SKILLS.md`.
-   [ ] Read `solution.py`.
-   [ ] Inspect frontend package.
-   [ ] Inspect backend package.
-   [ ] Inspect environment configuration.
-   [ ] Identify current run commands.
-   [ ] Identify existing database.
-   [ ] Identify existing APIs.
-   [ ] Identify reusable components.

**Do not code yet.**

Deliver a short architecture assessment.

------------------------------------------------------------------------

# 63. PHASE 1 --- FOUNDATION

-   [ ] Create/fix backend structure.
-   [ ] Create FastAPI app.
-   [ ] Add configuration.
-   [ ] Add environment variables.
-   [ ] Add `/api/health`.
-   [ ] Configure CORS.
-   [ ] Verify frontend ↔ backend connection.
-   [ ] Add `.env.example`.
-   [ ] Verify `.gitignore`.

### Checkpoint

``` text
Frontend can call:
GET /api/health
```

------------------------------------------------------------------------

# 64. PHASE 2 --- GROQ

-   [ ] Install Groq SDK or compatible client.
-   [ ] Create `groq_service.py`.
-   [ ] Load `GROQ_API_KEY` from environment.
-   [ ] Add configurable model name.
-   [ ] Add goal parsing.
-   [ ] Add structured output validation.
-   [ ] Add mentor request.
-   [ ] Add error handling.
-   [ ] Test a real request.

### Checkpoint

Goal:

``` text
"I want to become an AI/ML engineer in 8 months."
```

produces structured goal data.

------------------------------------------------------------------------

# 65. PHASE 3 --- EXISTING ML MODEL

-   [ ] Inspect `solution.py`.
-   [ ] Create adapter.
-   [ ] Run inference.
-   [ ] Normalize output.
-   [ ] Test valid input.
-   [ ] Test invalid input.
-   [ ] Confirm model does not need to be rewritten.

### Checkpoint

Backend can produce actual model recommendations.

------------------------------------------------------------------------

# 66. PHASE 4 --- DATA

-   [ ] Create resource schema.
-   [ ] Create skills.
-   [ ] Create prerequisite relationships.
-   [ ] Add realistic seed data.
-   [ ] Add learner demo profile.
-   [ ] Add progress data.
-   [ ] Add sample feedback.

### Checkpoint

Backend has enough data to generate a complete AI/ML learning path.

------------------------------------------------------------------------

# 67. PHASE 5 --- RECOMMENDATION ENGINE

-   [ ] Implement skill-gap calculation.
-   [ ] Generate candidates.
-   [ ] Call `solution.py`.
-   [ ] Apply prerequisite filtering.
-   [ ] Apply learner constraints.
-   [ ] Rank recommendations.
-   [ ] Produce explanation metadata.

### Checkpoint

Same goal + different learner profiles should produce meaningfully
different recommendations.

------------------------------------------------------------------------

# 68. PHASE 6 --- PATH GENERATION

-   [ ] Build dependency graph.
-   [ ] Resolve prerequisites.
-   [ ] Topologically order resources.
-   [ ] Remove completed content.
-   [ ] Add projects.
-   [ ] Add assessments.
-   [ ] Generate milestones.
-   [ ] Estimate timeline.

### Checkpoint

The system produces a complete ordered learning path.

------------------------------------------------------------------------

# 69. PHASE 7 --- FRONTEND ONBOARDING

-   [ ] Build landing.
-   [ ] Build goal input.
-   [ ] Connect goal API.
-   [ ] Build profile conversation.
-   [ ] Build profile confirmation.
-   [ ] Connect profile API.

### Checkpoint

User can go from:

``` text
Landing
→ Goal
→ Profile
```

using real backend data.

------------------------------------------------------------------------

# 70. PHASE 8 --- PATH UI

-   [ ] Build analysis screen.
-   [ ] Build path visualization.
-   [ ] Connect path API.
-   [ ] Build path node.
-   [ ] Build detail side panel.
-   [ ] Build "Why this?" explanation.
-   [ ] Add meaningful transitions.

### Checkpoint

The path is rendered from backend data, not hardcoded JSX.

------------------------------------------------------------------------

# 71. PHASE 9 --- DASHBOARD

-   [ ] Build dashboard.
-   [ ] Connect dashboard API.
-   [ ] Build progress summary.
-   [ ] Build current learning card.
-   [ ] Build skill visualization.
-   [ ] Build next actions.
-   [ ] Build milestones.

### Checkpoint

Dashboard reflects actual learner state.

------------------------------------------------------------------------

# 72. PHASE 10 --- PROGRESS + FEEDBACK

-   [ ] Add completion actions.
-   [ ] Add progress API.
-   [ ] Add feedback controls.
-   [ ] Store feedback.
-   [ ] Recalculate affected recommendations.

### Checkpoint

Completing content changes the dashboard.

Negative feedback changes future recommendations.

------------------------------------------------------------------------

# 73. PHASE 11 --- AI MENTOR

-   [ ] Build mentor UI.
-   [ ] Build mentor API.
-   [ ] Load learner context.
-   [ ] Send grounded context to Groq.
-   [ ] Return answer.
-   [ ] Handle errors.
-   [ ] Preserve conversation context where appropriate.

### Checkpoint

Ask:

``` text
Why is Statistics before Machine Learning?
```

and receive an answer based on the actual path.

------------------------------------------------------------------------

# 74. PHASE 12 --- ADAPTIVE LEARNING

-   [ ] Add adaptive service.
-   [ ] Add what-if simulation.
-   [ ] Support study-time changes.
-   [ ] Support difficulty feedback.
-   [ ] Support progress changes.
-   [ ] Preserve real path during simulation.

### Checkpoint

3 hours/week must produce a different simulated path than 6 hours/week.

------------------------------------------------------------------------

# 75. PHASE 13 --- DESIGN POLISH

Only after the product works:

-   [ ] Refine typography.
-   [ ] Refine spacing.
-   [ ] Refine colors.
-   [ ] Refine path visualization.
-   [ ] Add subtle animation.
-   [ ] Add loading states.
-   [ ] Add error states.
-   [ ] Add empty states.
-   [ ] Improve mobile.
-   [ ] Improve accessibility.
-   [ ] Remove unnecessary visual effects.

------------------------------------------------------------------------

# 76. PHASE 14 --- FINAL QA

-   [ ] Run backend tests.
-   [ ] Run frontend lint.
-   [ ] Run frontend build.
-   [ ] Run backend locally.
-   [ ] Run frontend locally.
-   [ ] Test CORS.
-   [ ] Test Groq.
-   [ ] Test ML model.
-   [ ] Test database.
-   [ ] Test complete demo.
-   [ ] Test mobile.
-   [ ] Check browser console.
-   [ ] Check backend logs.
-   [ ] Check secret exposure.
-   [ ] Check `.gitignore`.
-   [ ] Verify README.

------------------------------------------------------------------------

# 77. DEFINITION OF DONE

The project is DONE only when:

``` text
Goal
 ↓
Profile
 ↓
Skill gaps
 ↓
ML recommendation
 ↓
Prerequisites
 ↓
Personalized path
 ↓
Explanation
 ↓
Dashboard
 ↓
Progress
 ↓
Feedback
 ↓
Adaptation
```

works end-to-end.

A beautiful frontend without this flow is not complete.

A working backend without a clear learning experience is not complete.

The project must combine both.

------------------------------------------------------------------------

# 78. FINAL PRODUCT PRINCIPLE

Build:

> **A learning navigation system, not a course catalog.**

The learner should always understand:

``` text
Where am I?
      ↓
What am I missing?
      ↓
Why is this next?
      ↓
What will it unlock?
      ↓
What should I do today?
      ↓
How does my path change as I learn?
```

That is the product.

That is the solution to the problem statement.

That is what the HCLTech demo should prove.
