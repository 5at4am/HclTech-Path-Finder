import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Route, Radar, BookOpen, FolderGit2, Sparkles,
  Menu, X, Compass,
} from "lucide-react";
import { useApp } from "../lib/store";
import { api } from "../lib/api";
import { cx } from "./ui";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/path", label: "My Path", icon: Route },
  { to: "/skills", label: "Skills", icon: Radar },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/mentor", label: "AI Mentor", icon: Sparkles },
];

function Brand() {
  return (
    <div className="flex items-center gap-2">
          <span className="grid h-[32px] w-[32px] place-items-center rounded-btn bg-route text-white">
        <Compass size={18} />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">Astrolabe</span>
    </div>
  );
}

export default function AppShell() {
  const { learnerId } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [greetingLine, setGreetingLine] = useState<string>("Your learning home");

  useEffect(() => {
    const h = new Date().getHours();
    const salutation = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    if (!learnerId) {
      setGreetingLine("Your learning home");
      return;
    }
    api
      .dashboard(learnerId)
      .then((d) => setGreetingLine(d.name ? `${salutation}, ${d.name}` : salutation))
      .catch(() => setGreetingLine(salutation));
  }, [learnerId]);

  return (
    <div className="app-bg min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/60 px-4 py-6 md:block">
        <div className="mb-8 px-2">
          <Brand />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cx("nav-link", isActive && "nav-link-active")}>
              <n.icon size={18} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-border pt-4">
          <p className="px-3 text-[11px] leading-relaxed text-muted">
            Your goal. Your path. Your pace.
          </p>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <motion.aside
              className="absolute left-0 top-0 h-full w-[256px] border-r border-border bg-surface p-4"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <Brand />
                <button onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV.map((n) => (
                  <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className={({ isActive }) => cx("nav-link", isActive && "nav-link-active")}>
                    <n.icon size={18} /> {n.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border/50 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">{greetingLine}</p>
              <h1 className="text-sm font-semibold text-primary">Your learning home</h1>
            </div>
          </div>
          <button onClick={() => navigate("/mentor")} className="btn-subtle">
            <Sparkles size={16} /> Ask Astrolabe
          </button>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
