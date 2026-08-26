import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  GoalAnalysisResponse,
  ProfileCreate,
  ProfileResponse,
  SimulateResponse,
} from "./types";

export const qk = {
  health: ["health"] as const,
  dashboard: (id: string) => ["dashboard", id] as const,
  recommendations: (id: string) => ["recommendations", id] as const,
  profile: (id: string) => ["profile", id] as const,
  path: (id: string) => ["path", id] as const,
  mentorHistory: (id: string) => ["mentor-history", id] as const,
};

export function useHealth() {
  return useQuery({ queryKey: qk.health, queryFn: api.health, retry: false });
}

export function useDashboard(learnerId: string | null) {
  return useQuery({
    queryKey: qk.dashboard(learnerId ?? ""),
    queryFn: () => api.dashboard.get(learnerId!),
    enabled: !!learnerId,
  });
}

export function useRecommendations(learnerId: string | null) {
  return useQuery({
    queryKey: qk.recommendations(learnerId ?? ""),
    queryFn: () => api.recommendations.get(learnerId!),
    enabled: !!learnerId,
  });
}

export function useProfile(learnerId: string | null) {
  return useQuery({
    queryKey: qk.profile(learnerId ?? ""),
    queryFn: () => api.profile.get(learnerId!),
    enabled: !!learnerId,
  });
}

export function useAnalyzeGoal() {
  return useMutation({
    mutationFn: (goal: string) => api.goals.analyze(goal),
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileCreate) => api.profile.create(data),
    onSuccess: (profile: ProfileResponse) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}

export function useGeneratePath(learnerId: string | null) {
  return useMutation({
    mutationFn: () => api.paths.generate(learnerId!),
  });
}

export function usePath(pathId: string | null) {
  return useQuery({
    queryKey: qk.path(pathId ?? ""),
    queryFn: () => api.paths.get(pathId!),
    enabled: !!pathId,
  });
}

export function useSimulate() {
  return useMutation({
    mutationFn: (vars: { learnerId: string; changes: Record<string, unknown> }) =>
      api.paths.simulate(vars.learnerId, vars.changes) as Promise<SimulateResponse>,
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      learnerId: string;
      resourceId: string;
      completionPercentage: number;
      status?: string;
      timeSpentHours?: number;
    }) =>
      api.progress.update(
        vars.learnerId,
        vars.resourceId,
        vars.completionPercentage,
        vars.status,
        vars.timeSpentHours ?? 0,
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.dashboard(vars.learnerId) });
    },
  });
}

export function useFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      learnerId: string;
      resourceId: string;
      helpful: boolean;
      reason?: string;
    }) => api.feedback.send(vars.learnerId, vars.resourceId, vars.helpful, vars.reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries();
    },
  });
}

export function useMentorChat(learnerId: string | null) {
  return useMutation({
    mutationFn: (message: string) => api.mentor.chat(learnerId!, message),
  });
}

export function useMentorHistory(learnerId: string | null) {
  return useQuery({
    queryKey: qk.mentorHistory(learnerId ?? ""),
    queryFn: () => api.mentor.history(learnerId!),
    enabled: !!learnerId,
  });
}

export function useExplainStep() {
  return useMutation({
    mutationFn: (vars: { pathId: string; stepId: string }) =>
      api.paths.explainStep(vars.pathId, vars.stepId),
  });
}
