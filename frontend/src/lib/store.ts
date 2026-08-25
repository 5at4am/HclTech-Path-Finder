import { create } from "zustand";
import type { GoalAnalysis, ProfileData } from "./types";

interface AppState {
  learnerId: string | null;
  pathId: string | null;
  goalAnalysis: GoalAnalysis | null;
  profileDraft: Partial<ProfileData> | null;
  setLearnerId: (id: string) => void;
  setPathId: (id: string) => void;
  setGoalAnalysis: (g: GoalAnalysis) => void;
  setProfileDraft: (p: Partial<ProfileData>) => void;
  reset: () => void;
}

const KEY = "astrolabe_state_v1";

function load(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const initial = load();

export const useApp = create<AppState>((set, get) => ({
  learnerId: initial.learnerId ?? null,
  pathId: initial.pathId ?? null,
  goalAnalysis: initial.goalAnalysis ?? null,
  profileDraft: initial.profileDraft ?? null,
  setLearnerId: (id) => {
    set({ learnerId: id });
    persist(get());
  },
  setPathId: (id) => {
    set({ pathId: id });
    persist(get());
  },
  setGoalAnalysis: (g) => {
    set({ goalAnalysis: g });
    persist(get());
  },
  setProfileDraft: (p) => {
    set({ profileDraft: { ...get().profileDraft, ...p } });
    persist(get());
  },
  reset: () => {
    set({ learnerId: null, pathId: null, goalAnalysis: null, profileDraft: null });
    localStorage.removeItem(KEY);
  },
}));

function persist(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      learnerId: state.learnerId,
      pathId: state.pathId,
      goalAnalysis: state.goalAnalysis,
      profileDraft: state.profileDraft,
    }));
  } catch {
    /* ignore */
  }
}
