import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Clock, Target, TrendingUp, ListChecks } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { SkillBar, cx, ErrorState, DashboardSkeleton } from "../components/ui";
import type { DashboardResponse } from "../lib/types";

export default function Dashboard() {
  const { learnerId } = useApp();
  const navigate = useNavigate();
  useEffect(() => { if (!learnerId) navigate("/onboarding"); }, [learnerId, navigate]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", learnerId],
    queryFn: () => api.dashboard(learnerId!),
    enabled: !!learnerId,
  });

  if (!learnerId) return null;
  if (isError) return (
    <ErrorState
      title="We couldn't load your dashboard."
      body="Make sure the backend is running on port 8000, then try again."
      action={<button onClick={() => refetch()} className="btn-primary">Retry</button>}
    />
  );
  if (isLoading || !data) return <DashboardSkeleton />;

  const d = data as DashboardResponse;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back, {d.name}</h1>
        <p className="text-secondary">You're working toward <span className="text-primary font-medium">{d.target_role}</span></p>
        {d.interests?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {d.interests.map((it: string) => (
              <span key={it} className="pill">{it}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric delay={0} icon={<Target size={16} />} label="Path complete" value={`${d.path_complete_pct}%`} />
        <Metric delay={0.06} icon={<TrendingUp size={16} />} label="Skills covered" value={d.skills_covered} />
        <Metric delay={0.12} icon={<Flame size={16} />} label="Learning streak" value={`${d.streak_days} days`} />
        <Metric delay={0.18} icon={<Clock size={16} />} label="This week" value={`${d.hours_this_week} hrs`} />
      </div>

      {d.continue_resource && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-5">
          <p className="meta">Continue your path</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-primary">{d.continue_resource.title}</h2>
              <div className="mt-2 h-2 w-[256px] max-w-full rounded-full bg-border">
                <div className="h-2 rounded-full bg-progress" style={{ width: `${d.continue_pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{d.continue_pct}% · {d.continue_remaining_hours} hrs remaining</p>
            </div>
            <button onClick={() => navigate("/path")} className="btn-primary">Continue learning <ArrowRight size={16} /></button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center gap-2"><ListChecks size={16} className="text-accent" /><h3 className="font-semibold">Next actions</h3></div>
          <ul className="space-y-2">
            {d.next_actions.map((a, i) => (
              <li key={i} className="flex items-center gap-2 rounded-btn bg-surface px-3 py-2 text-sm text-primary">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-soft text-[11px] text-accent">{i + 1}</span>
                {a}
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h3 className="mb-3 font-semibold">Skill development</h3>
          <div className="space-y-3">
            {d.skills.slice(0, 6).map((s) => (
              <SkillBar key={s.skill} label={s.skill} level={s.level} required={s.required} />
            ))}
          </div>
          <button onClick={() => navigate("/skills")} className="btn-subtle mt-4 w-full">View all skills</button>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h3 className="mb-3 font-semibold text-warning">Priority gaps</h3>
          <ol className="space-y-2">
            {d.priority_gaps.map((g, i) => (
              <li key={g.skill} className="flex items-center gap-3 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-warning/15 text-xs font-bold text-warning">{String(i + 1).padStart(2, "0")}</span>
                <span className="capitalize text-primary">{g.skill.replace(/_/g, " ")}</span>
                <span className="ml-auto text-xs text-muted">now {g.current_level}%</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card p-5">
          <h3 className="mb-3 font-semibold">Recent feedback</h3>
          {d.recent_feedback.length === 0 ? (
            <p className="text-sm text-muted">No feedback yet. Rate recommendations to adapt your path.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.recent_feedback.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-btn bg-surface px-3 py-2">
                  <span className="text-secondary">{f.resource_id}</span>
                  <span className={cx("text-xs", f.helpful ? "text-success" : "text-warning")}>{f.helpful ? "Helpful" : f.reason || "Not useful"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, delay = 0 }: { icon: ReactNode; label: string; value: string; delay?: number }) {
  return (
    <motion.div
      className="card p-4 transition-colors duration-200 hover:border-accent/40"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.21, 0.65, 0.36, 1] }}
    >
      <div className="flex items-center gap-2 text-muted">{icon}<span className="text-xs">{label}</span></div>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
    </motion.div>
  );
}
