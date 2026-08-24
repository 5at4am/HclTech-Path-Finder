# AI-Powered Personalized Learning Path Recommender

## Overview

Design and prototype an AI-powered solution that delivers personalized learning experiences based on an individual's needs, interests, learning patterns, and goals. The system bridges the gap between vast course catalogs and learners' specific objectives by generating structured roadmaps tailored to each individual.

## Architecture

### 1. Conversational Interface

- **Natural Language Goal Input**: Learners describe their goals in plain text (e.g., "I want to become a front-end developer in 6 months", "Learn data science for career transition")
- **Context Capture**: System extracts key entities: domain, skill level, timeline, objectives, preferences
- **Conversation Flow**: Multi-turn interaction to refine understanding when information is incomplete

### 2. Learner Profiling Engine

| Profile Component | Description | Data Source |
|-------------------|-------------|-------------|
| **Interests** | Preferred domains, topics, technologies | Initial input + explicit selections |
| **Experience Level** | Current skill level per domain (beginner/intermediate/expert) | Self-assessment + historical data |
| **Completed Courses** | Courses already taken, projects finished | LMS integration, user records |
| **Objectives** | Specific career goals, certifications, projects to build | Initial input + updates |
| **Learning Patterns** | Preferred pace, study times, interaction style | Interaction analytics, surveys |
| **Preferences** | Learning format (video/text), difficulty, duration, language | User settings |

### 3. Recommendation Engine

**Input**: Learner profile, skill gaps, available courses, objectives
**Output**: Ranked list of learning resources with rationale

**Algorithmic Approach**:
- **Content-based filtering**: Match course features (topic, level, duration) to learner profile
- **Collaborative filtering**: Identify learners with similar profiles and paths
- **Goal-directed sequencing**: Generate ordered sequence based on prerequisites
- **Interest weighting**: Prioritize topics aligned with learner interests

**Recommendation Types**:
- Courses (video, text, interactive)
- Projects (hands-on, portfolio-building)
- Assessments (quizzes, coding challenges)
- External resources (articles, tutorials, documentation)

### 4. Learning Path Generator

**Prerequisite Mapping**:
- Course dependency graph: Determine what must be completed before others
- Skill prerequisite chains: Map foundational → advanced skills
- Milestone markers: Key checkpoints along the path

**Path Generation Algorithm**:
1. Identify current skill level and gaps
2. Map required skills to achieve objectives
3. Find shortest path through course graph
4. Insert interest-aligned electives at appropriate points
5. Generate milestones and estimated timelines

**Output Format**:
- Structured roadmap with phases/steps
- Each step: course/resource, prerequisites, estimated duration, milestones
- Visual dependency graph
- Progress tracking checkpoints

### 5. AI Explanation Assistant

**Why Recommendations**:
- For each recommendation: explain relevance to goals, skill gaps addressed, interest alignment
- "This course addresses your gap in React state management while building on your JavaScript fundamentals"
- "Chosen because 78% of learners with similar profiles completed this before your target timeline"

**Query Answering**:
- Natural language questions about recommendations
- "Why is this course #3 on my list?"
- "What do I need to know before starting this?"
- "How does this project help my career goals?"

### 6. Dashboard Visualization

**Key Visualizations**:
- **Progress Map**: Graph showing completed/ongoing/planned courses with dependency lines
- **Skill Radar**: Radar chart displaying skill development across domains
- **Milestone Timeline**: Horizontal timeline showing completed and upcoming milestones
- **Next Actions**: Card view of 3-5 immediately recommended actions
- **Interest Alignment**: Gauge showing how current path aligns with stated interests
- **Timeline Progress**: Bar chart showing completion percentage vs. target date

**Interactions**:
- Filter by time period, domain, completion status
- Hover for details on each course/resource
- Drag-and-drop to reorder or mark as interest-changed
- Export path as shareable link or PDF

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **ML Pipeline** | MLflow + scikit-learn / TensorFlow | Experiment tracking, model training, reproducibility |
| **Frontend** | React + TypeScript + Tailwind CSS | Component-driven UI, responsive design, rapid development |
| **State Management** | Zustand or Redux Toolkit | Global state for learner profile, path selection |
| **Data Fetching** | SWR or React Query | Server-state management, caching, revalidation |
| **3D Visualization** | React Three Fiber + @react-three/drei | Interactive learning path graphs, skill dependency trees |
| **Animated UI** | React Bits components | Ready-made animated components for faster development |
| **Glassmorphism UI** | Liquid Glass JS | Modern glass panels for dashboard, modals, cards |
| **Backend** | Node.js + Express | API server for recommendation engine, conversation management |
| **Database** | PostgreSQL + Drizzle ORM | Learner profiles, course data, progress tracking |
| **Experiment Tracking** | MLflow | Track recommendation model performance, A/B test results |

## MVP Feature Set

### Phase 1 (Core MVP)

1. **Goal Input**: Natural language goal description with entity extraction
2. **Basic Profiling**: Skill level (beginner/intermediate/expert), primary interest area
3. **Simple Recommendation**: 3-5 course suggestions based on goal + level
4. **Basic Explanation**: Why each course was recommended (simple rule-based)
5. **Progress Tracker**: Simple checklist of completed/remaining courses

### Phase 2 (Enhanced)

1. **Full Profiling**: Interests, completed courses, learning patterns, objectives
2. **Sequenced Paths**: Full learning roadmap with prerequisites and milestones
3. **AI Explanations**: Context-aware explanations using LLM
4. **Dashboard**: Visual progress, skill development, next actions
5. **Feedback Loop**: User can mark recommendations as helpful/not, system learns

### Phase 3 (Advanced)

1. **Adaptive Learning**: Real-time path adjustment based on progress
2. **Predictive Completion**: Estimate time to goal based on actual progress
3. **Community Insights**: Compare path with similar learners
4. **Career Integration**: Connect to job market requirements, skill demand
5. **3D Path Visualization**: Interactive graph of learning journey

## Data Model (Simplified)

```typescript
interface LearnerProfile {
  id: string
  interests: string[]  // ["web development", "data visualization", ...]
  skillLevel: Record<string, "beginner" | "intermediate" | "expert">
  completedCourses: string[]  // course IDs
  objectives: string[]  // ["become junior developer", "build portfolio", ...]
  learningPatterns: {
    preferredPace: "slow" | "moderate" | "fast"
    studyTimePerWeek: number
    preferredFormat: "video" | "text" | "interactive"
  }
  preferences: {
    difficultyPreference: "easy" | "medium" | "hard"
    durationPreference: "short" | "medium" | "long"
  }
  createdAt: Date
  updatedAt: Date
}

interface Course {
  id: string
  title: string
  domain: string
  level: "beginner" | "intermediate" | "expert"
  duration: number  // hours
  prerequisites: string[]  // course IDs
  topics: string[]
  format: "video" | "text" | "interactive"
  rating: number
}

interface LearningPath {
  id: string
  learnerId: string
  goal: string
  steps: LearningStep[]
  createdAt: Date
  updatedAt: Date
}

interface LearningStep {
  courseId: string
  order: number
  prerequisitesCompleted: boolean
  status: "pending" | "in-progress" | "completed"
  estimatedCompletion: Date
  milestone: boolean
}
```

## ML Pipeline Design

### Experiment Tracking

- Log recommendation model parameters (filter weights, priority given to interests vs. prerequisites)
- Track metrics: recommendation relevance, user satisfaction, completion rates
- A/B test different recommendation strategies

### Feature Engineering

- Learner profile features: interest vectors, skill level encoding, completion history
- Course features: topic embeddings, level, duration, prerequisite graph position
- Interaction features: time spent, completion rate, feedback ratings

### Model Training

- Train collaborative filtering model on anonymized learner-path data
- Content-based model using course-content embeddings
- Combine models with weighted ensemble based on A/B test results

### Retraining Pipeline

- Monthly retraining with new data
- Monitor for model drift (changing course catalog, evolving interests)
- Canary deploy new model versions

## UI/UX Design

### Visual Design Language

- **Glassmorphism**: Use Liquid Glass JS for dashboard panels, modals, cards
- **Glass panels** with backdrop-filter blur over course catalog content
- **Specular highlights** on interactive elements for depth
- **Chromatic aberration** subtly on hover states for "physical" feel

### Color Palette

- Background: #0a0a0f (near-black)
- Surface: #16161f (elevated backgrounds)
- On-surface: #e8e8ec (primary text)
- Muted: #6b6b80 (secondary text)
- Accent: #00d4aa (teal - for progress indicators, highlights)
- Warning: #f5a623 (orange - for attention items)
- Error: #ff5f57 (red - for errors, completions)

### Key Screens

1. **Goal Input**: Minimal form with text input + submit, glass-style
2. **Learner Profile**: Expandable sections, tabs for different profile aspects
3. **Learning Path**: Horizontal timeline with cards for each step, dependency lines
4. **Dashboard**: Three-pane layout (progress map left, skill radar right, next actions center)
5. **Recommendation Detail**: Card with course info + AI explanation toggle

### Interaction Patterns

- **Smooth transitions** between path phases using Framer Motion
- **Micro-interactions** on course cards (hover lift, click ripple)
- **Skeleton loaders** for all async content
- **Respect prefers-reduced-motion** for all animations

## Implementation Roadmap

### Week 1-2: Project Setup & Foundation

- Initialize React + TypeScript project
- Set up Tailwind CSS with glassmorphism theme
- Install dependencies: Zustand, SWR, @react-three/fiber, @react-three/drei, liquid-glass-react, framer-motion
- Configure mlflow for experiment tracking
- Set up PostgreSQL + Drizzle ORM schema

### Week 3-4: Core Features

- Build conversational goal input component
- Implement learner profiling engine (form + validation)
- Develop basic recommendation engine (content-first, rule-based)
- Create explanation assistant (simple rule-based rationale)

### Week 5-6: Path Generation & Dashboard

- Implement learning path generator with prerequisite mapping
- Build dashboard components (progress map, skill radar, next actions)
- Integrate Liquid Glass JS for glass panels
- Add 3D visualization of learning path using React Three Fiber

### Week 7-8: Feedback & Adaptation

- Build feedback mechanism (thumbs up/down on recommendations)
- Implement basic learning pattern tracking
- Create A/B test framework using MLflow
- User testing and iteration

### Week 9-10: Advanced & Polish

- Integrate LLM for AI explanations (OpenAI or Anthropic)
- Build full recommendation pipeline with collaborative filtering
- Optimize performance, accessibility
- Deploy and document

## Success Metrics

- **Recommendation relevance**: % of users who find recommendations relevant (target: 70%+)
- **Path completion rate**: % of learners who complete their recommended path within target timeline (target: 50%+)
- **User satisfaction**: Net Promoter Score for the recommendation experience (target: 40+)
- **Engagement**: Average sessions per week, time per session
- **Goal achievement**: % of learners who report achieving their stated objective

## Future Enhancements

1. **Predictive Analytics**: Estimate time-to-goal based on actual progress patterns
2. **Career Integration**: Auto-update recommendations based on job market demand changes
3. **Social Features**: Share paths, compare with peers, collaborative learning groups
4. **Certification Tracking**: Integrate with external platforms (Coursera, Udemy, etc.)
5. **Micro-learning**: Break down long courses into micro-learning paths