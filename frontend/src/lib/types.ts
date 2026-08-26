// TypeScript mirror of backend/app/schemas/__init__.py
// Only render fields the API actually returns. Never fabricate.

export interface GoalAnalysisResponse {
  goal: string;
  domain: string;
  target_role: string;
  timeline_months?: number | null;
  objectives: string[];
  detected_skills: string[];
  missing_information: string[];
  summary: string;
}

export interface ProfileCreate {
  learner_id?: string | null;
  name?: string;
  goal?: string;
  target_role?: string;
  timeline_months?: number;
  interests?: string[];
  experience_level?: string;
  current_skills?: Record<string, number>;
  completed_courses?: string[];
  objectives?: string[];
  study_time_per_week?: number;
  preferred_format?: string;
  preferred_pace?: string;
  difficulty_preference?: string;
  learning_history?: string[];
}

export interface ProfileResponse {
  learner_id: string;
  name: string;
  goal: string;
  target_role: string;
  timeline_months: number;
  interests: string[];
  experience_level: string;
  current_skills: Record<string, number>;
  completed_courses: string[];
  objectives: string[];
  study_time_per_week: number;
  preferred_format: string;
  preferred_pace: string;
  difficulty_preference: string;
  learning_history: string[];
  created_at?: string | null;
}

export interface ResourceOut {
  id: string;
  title: string;
  type: string;
  domain: string;
  difficulty: string;
  duration_hours: number;
  format: string;
  description: string;
  skills_gained: string[];
  prerequisites: string[];
  phase: string;
  optional: boolean;
  rating: number;
}

export interface Evidence {
  course_signatures: string[];
  matched_signatures: string[];
  similarity: number;
  peer_courses: string[];
  source: string;
}

export interface RecommendationOut {
  resource: ResourceOut;
  evidence: Evidence | null;
  model_relevance: number;
  skill_gap_match: number;
  interest_match: number;
  prerequisite_fit: number;
  difficulty_fit: number;
  time_fit: number;
  evidence_score: number;
  match_score: number;
  reason: string;
}

export interface RecommendationsResponse {
  learner_id: string;
  recommendations: RecommendationOut[];
}

export interface LearningStepOut {
  id: string;
  resource_id: string;
  order: number;
  phase: string;
  status: "completed" | "current" | "recommended" | "locked" | "optional";
  completion_percentage: number;
  estimated_hours: number;
  milestone: boolean;
  recommendation_score: number;
  reason: string;
  prerequisites: string[];
  skills_gained: string[];
  resource: ResourceOut;
  unlocks: string[];
  evidence: Evidence | null;
}

export interface PathGenerateResponse {
  path_id: string;
  learner_id: string;
  goal: string;
  target_role: string;
  timeline_months: number;
  study_time_per_week: number;
  prerequisite_coverage_pct: number;
  steps: LearningStepOut[];
}

export interface PathOut extends PathGenerateResponse {}

export interface SimulateResponse {
  current: Record<string, number>;
  simulated: Record<string, number>;
  changes_summary: string[];
  steps: LearningStepOut[];
}

export interface ProgressResponse {
  learner_id: string;
  resource_id: string;
  completion_percentage: number;
  status: string;
  next_action?: string | null;
  path_complete_pct: number;
}

export interface FeedbackResponse {
  id: string;
  adaptation: string;
  learner_id: string;
}

export interface MentorResponse {
  message: string;
  sources: Record<string, unknown>[];
  evidence: Evidence | null;
}

export interface MentorHistoryItem {
  role: "user" | "assistant";
  message: string;
  sources: Record<string, unknown>[];
}

export interface DashboardResponse {
  learner_id: string;
  name: string;
  goal: string;
  target_role: string;
  timeline_months: number;
  study_time_per_week: number;
  interests: string[];
  path_id: string | null;
  path_complete_pct: number;
  skills_covered: string;
  streak_days: number;
  hours_this_week: number;
  continue_resource: ResourceOut | null;
  continue_pct: number;
  continue_remaining_hours: number;
  next_actions: string[];
  skills: { skill: string; level: number; required: number; gap: number; domain: string }[];
  priority_gaps: { skill: string; gap: number; current_level: number }[];
  recent_feedback: { resource_id: string; helpful: boolean; reason: string }[];
}

export interface HealthResponse {
  status: string;
  version: string;
  groq_configured: boolean;
  database?: string;
  resources?: number;
  model_ready?: boolean;
}

export const STEP_STATUS = {
  completed: "completed",
  current: "current",
  recommended: "recommended",
  available: "available",
  locked: "locked",
  optional: "optional",
} as const;
