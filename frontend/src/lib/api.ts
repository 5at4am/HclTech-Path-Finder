import type {
  DashboardResponse,
  Evidence,
  FeedbackResponse,
  GoalAnalysisResponse,
  HealthResponse,
  LearningStepOut,
  MentorHistoryItem,
  MentorResponse,
  PathGenerateResponse,
  PathOut,
  ProfileCreate,
  ProfileResponse,
  ProgressResponse,
  RecommendationsResponse,
  SimulateResponse,
} from "./types";

const BASE = "/api";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      // ignore non-JSON error bodies
    }
    const message =
      (detail && typeof detail === "object" && "detail" in detail
        ? String((detail as { detail: unknown }).detail)
        : null) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, detail);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function jsonBody(data: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(data) };
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  goals: {
    analyze: (goal: string) =>
      request<GoalAnalysisResponse>("/goals/analyze", jsonBody({ goal })),
  },

  profile: {
    create: (data: ProfileCreate) =>
      request<ProfileResponse>("/profile", jsonBody(data)),
    get: (learnerId: string) =>
      request<ProfileResponse>(`/profile/${encodeURIComponent(learnerId)}`),
  },

  dashboard: {
    get: (learnerId: string) =>
      request<DashboardResponse>(`/dashboard/${encodeURIComponent(learnerId)}`),
  },

  recommendations: {
    get: (learnerId: string) =>
      request<RecommendationsResponse>(
        `/recommendations/${encodeURIComponent(learnerId)}`,
      ),
  },

  paths: {
    generate: (learnerId: string) =>
      request<PathGenerateResponse>("/paths/generate", jsonBody({ learner_id: learnerId })),
    get: (pathId: string) => request<PathOut>(`/paths/${encodeURIComponent(pathId)}`),
    adapt: (pathId: string) =>
      request<PathGenerateResponse>(`/paths/${encodeURIComponent(pathId)}/adapt`, {
        method: "POST",
      }),
    simulate: (learnerId: string, changes: Record<string, unknown>) =>
      request<SimulateResponse>(
        "/paths/simulate",
        jsonBody({ learner_id: learnerId, changes }),
      ),
    explainStep: (pathId: string, stepId: string) =>
      request<MentorResponse>(
        `/paths/${encodeURIComponent(pathId)}/steps/${encodeURIComponent(stepId)}/explain`,
      ),
  },

  progress: {
    update: (
      learnerId: string,
      resourceId: string,
      completionPercentage: number,
      status?: string,
      timeSpentHours = 0,
    ) =>
      request<ProgressResponse>(
        "/progress",
        jsonBody({
          learner_id: learnerId,
          resource_id: resourceId,
          completion_percentage: completionPercentage,
          status,
          time_spent_hours: timeSpentHours,
        }),
      ),
    get: (learnerId: string) =>
      request<{ learner_id: string; progress: unknown[] }>(
        `/progress/${encodeURIComponent(learnerId)}`,
      ),
  },

  feedback: {
    send: (learnerId: string, resourceId: string, helpful: boolean, reason?: string) =>
      request<FeedbackResponse>(
        "/feedback",
        jsonBody({
          learner_id: learnerId,
          resource_id: resourceId,
          helpful,
          reason,
        }),
      ),
  },

  mentor: {
    chat: (learnerId: string, message: string) =>
      request<MentorResponse>("/mentor/chat", jsonBody({ learner_id: learnerId, message })),
    history: (learnerId: string) =>
      request<MentorHistoryItem[]>(`/mentor/history/${encodeURIComponent(learnerId)}`),
  },
};

export type { LearningStepOut, Evidence };
