const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      detail = await res.text();
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; groq_configured: boolean }>("/api/health"),
  analyzeGoal: (goal: string) =>
    request<import("./types").GoalAnalysis>("/api/goals/analyze", {
      method: "POST",
      body: JSON.stringify({ goal }),
    }),
  createProfile: (data: import("./types").ProfileData) =>
    request<import("./types").ProfileResponse>("/api/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getProfile: (id: string) =>
    request<import("./types").ProfileResponse>(`/api/profile/${id}`),
  recommendations: (id: string) =>
    request<{ learner_id: string; recommendations: import("./types").RecommendationOut[] }>(
      `/api/recommendations/${id}`
    ),
  generatePath: (id: string) =>
    request<import("./types").PathOut>("/api/paths/generate", {
      method: "POST",
      body: JSON.stringify({ learner_id: id }),
    }),
  getPath: (id: string) =>
    request<import("./types").PathOut>(`/api/paths/${id}`),
  adaptPath: (id: string) =>
    request<import("./types").PathOut>(`/api/paths/${id}/adapt`, { method: "POST" }),
  explainStep: (pathId: string, stepId: string) =>
    request<import("./types").MentorResponse>(
      `/api/paths/${pathId}/steps/${stepId}/explain`
    ),
  postProgress: (data: {
    learner_id: string;
    resource_id: string;
    completion_percentage: number;
    status?: string;
    time_spent_hours?: number;
  }) =>
    request<import("./types").ProgressResponse>("/api/progress", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  postFeedback: (data: {
    learner_id: string;
    resource_id: string;
    helpful: boolean;
    reason: string;
  }) =>
    request<import("./types").FeedbackResponse>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  mentorChat: (learner_id: string, message: string) =>
    request<import("./types").MentorResponse>("/api/mentor/chat", {
      method: "POST",
      body: JSON.stringify({ learner_id, message }),
    }),
  simulate: (learner_id: string, changes: Record<string, unknown>) =>
    request<import("./types").SimulateResponse>("/api/paths/simulate", {
      method: "POST",
      body: JSON.stringify({ learner_id, changes }),
    }),
  dashboard: (id: string) =>
    request<import("./types").DashboardResponse>(`/api/dashboard/${id}`),
};
