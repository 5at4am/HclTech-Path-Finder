import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  created_at?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

const LS_TOKEN = "padhai.token";
const LS_USER = "padhai.user";

function loadToken(): string | null {
  return localStorage.getItem(LS_TOKEN);
}
function loadUser(): AuthUser | null {
  const raw = localStorage.getItem(LS_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  token: loadToken(),
  user: loadUser(),

  setAuth: (token, user) => {
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_USER, JSON.stringify(user));
    set({ token, user });
  },
  setUser: (user) => {
    localStorage.setItem(LS_USER, JSON.stringify(user));
    set({ user });
  },
  clearAuth: () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    // also clear learner on logout to avoid orphaned sessions
    localStorage.removeItem("padhai.learnerId");
    set({ token: null, user: null });
  },
  isAuthenticated: () => !!get().token,
}));

// helper for non-hook contexts (api.ts)
export function getAuthToken(): string | null {
  return localStorage.getItem(LS_TOKEN);
}
