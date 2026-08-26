import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Compass,
  GitBranch,
  Lightbulb,
  TrendingUp,
  MessagesSquare,
  User,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useLearner } from "../store/useLearner";
import { cx } from "./ui";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Compass },
  { to: "/path", label: "Learning Path", icon: GitBranch },
  { to: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/mentor", label: "Mentor", icon: MessagesSquare },
  { to: "/profile", label: "Profile", icon: User },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid h-8 w-8 place-items-center rounded-md text-white font-bold"
        style={{ background: "linear-gradient(135deg, var(--violet-600), var(--violet-400))" }}
        aria-hidden
      >
        ◆
      </div>
      <span className="text-title font-semibold tracking-tight text-primary">PadhAI</span>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-soft text-primary"
                : "text-muted hover:text-primary hover:bg-surface-tertiary",
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={18}
                className={cx(isActive ? "text-brand" : "text-muted group-hover:text-secondary")}
              />
              <span>{label}</span>
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useLearner();
  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-icon"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function AppShell() {
  const { profile, learnerId, clearLearner } = useLearner();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const handleLogout = () => {
    clearLearner();
    navigate("/");
  };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr] bg-bg text-primary">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:border-r md:border-default bg-surface sticky top-0 h-screen p-4">
        <div className="px-2 py-3">
          <BrandMark />
        </div>
        <div className="mt-4 flex-1">
          <NavItems />
        </div>
        <div className="border-t border-default pt-3 mt-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate">{profile?.name ?? "Learner"}</p>
            <p className="text-caption text-muted truncate">{profile?.target_role || "No role set"}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-icon" title="Reset learner" aria-label="Reset learner">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-50 flex items-center justify-between border-b border-default bg-surface px-4 py-3">
        <BrandMark />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <Compass size={18} />
          </button>
        </div>
      </div>
      {mobileNavOpen && (
        <div className="md:hidden border-b border-default bg-surface px-3 py-3">
          <NavItems onNavigate={() => setMobileNavOpen(false)} />
        </div>
      )}

      <div className="flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between border-b border-default bg-surface backdrop-blur px-8 py-3 sticky top-0 z-40">
          <div className="text-sm text-muted">
            {profile?.goal ? (
              <span className="truncate">
                Goal: <span className="text-secondary">{profile.goal}</span>
              </span>
            ) : (
              <span>Your navigation context</span>
            )}
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 w-full max-w-container mx-auto">
          <Outlet />
        </main>
      </div>
      {learnerId ? null : null}
    </div>
  );
}
