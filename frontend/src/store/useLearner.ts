import { create } from "zustand";
import type { ProfileResponse } from "../lib/types";

type Theme = "dark" | "light";

interface LearnerState {
  learnerId: string | null;
  profile: ProfileResponse | null;
  theme: Theme;
  setLearner: (id: string, profile?: ProfileResponse) => void;
  setProfile: (profile: ProfileResponse) => void;
  clearLearner: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const LS_LEARNER = "padhai.learnerId";
const LS_THEME = "padhai.theme";

function initialTheme(): Theme {
  const stored = localStorage.getItem(LS_THEME);
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-theme", theme);
  localStorage.setItem(LS_THEME, theme);
}

const storedLearner = localStorage.getItem(LS_LEARNER);

export const useLearner = create<LearnerState>((set, get) => ({
  learnerId: storedLearner,
  profile: null,
  theme: initialTheme(),

  setLearner: (id, profile) => {
    localStorage.setItem(LS_LEARNER, id);
    set({ learnerId: id, ...(profile ? { profile } : {}) });
  },
  setProfile: (profile) => set({ profile }),
  clearLearner: () => {
    localStorage.removeItem(LS_LEARNER);
    set({ learnerId: null, profile: null });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },
}));

// Apply theme once at module load so the very first paint matches the store.
applyTheme(initialTheme());
