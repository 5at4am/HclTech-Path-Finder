import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, X, Loader2, GitCompare, Lock } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import type { LearningStepOut, MentorResponse, PathOut, SimulateResponse } from "../lib/types";
import LearningPath from "../components/LearningPath";
import { StatusBadge, cx, ErrorState } from "../components/ui";

export default function Path() {
  const { learnerId, pathId } = useApp();
  const navigate = useNavigate();
  const [path, setPath] = useState<PathOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LearningStepOut | null>(null);
  const [explain, setExplain] = useState<MentorResponse | null>(null);
  const [explainLoad, setExplainLoad] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [startLoad, setStartLoad] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const phases = useMemo(() => {
    if (!path) return [];
    const map: Record<string, LearningStepOut[]> = {};
    path.steps.forEach((s) => { (map[s.phase] ||= []).push(s); });
    return Object.entries(map);
  }, [path]);

  useEffect(() => {
    if (!learnerId) { navigate("/onboarding"); return; }
    (async () => {
      setLoading(true);
      try {
        const p = pathId ? await api.getPath(pathId) : await api.generatePath(learnerId);
        setPath(p);
      } catch (e) {
        setError((e as Error).message || "Could not load your path.");
      } finally {
        setLoading(false);
      }
    })();
  }, [learnerId, pathId, navigate, retryKey]);

  async function openStep(step: LearningStepOut) {
    setSelected(step);
    setExplain(null);
    if (path) {
      setExplainLoad(true);
      try {
        const r = await api.explainStep(path.path_id, step.id);
        setExplain(r);
      } catch {
        setExplain({ message: step.reason, sources: [] });
      } finally {
        setExplainLoad(false);
      }
    }
  }

  async function startStep(step: LearningStepOut) {
    if (!path || !learnerId) return;
    setStartLoad(true);
    try {
      await api.postProgress({
        learner_id: learnerId,
        resource_id: step.resource.id,
        status: "in_progress",
        completion_percentage: 5,
      });
      const p = await api.getPath(path.path_id);
      setPath(p);
    } finally {
      setStartLoad(false);
    }
  }

  if (loading) return <div className="app-bg grid min-h-screen place-items-center"><Loader2 className="animate-spin text-accent" /></div>;
  if (error) return (
    <div className="app-bg grid min-h-screen place-items-center px-6">
      <ErrorState
        title="We couldn't load your learning path."
        body={error}
        action={<button onClick={() => setRetryKey((k) => k + 1)} className="btn-primary">Retry</button>}
      />
    </div>
  );
  if (!path) return null;

  return (
    <div className="app-bg min-h-screen">
      <header className="container-page flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Pathwise</span>
        </div>
        <button onClick={() => navigate("/dashboard")} className="btn-primary">Open dashboard <ArrowRight size={16} /></button>
      </header>

      <main className="container-page grid gap-8 pb-16 lg:grid-cols-[1fr_320px]">
        <div>
          <span className="section-eyebrow">Your personalized path</span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{path.target_role}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary">
            <span>{path.timeline_months} months</span>
            <span className="text-border">·</span>
            <span>{path.study_time_per_week} hrs/week</span>
            <span className="text-border">·</span>
            <span className="text-progress">{path.prerequisite_coverage_pct}% of prerequisite skills already covered</span>
          </div>

          <div className="mt-8">
            <LearningPath steps={path.steps} selectedId={selected?.id} onSelect={openStep} />
          </div>
        </div>

        <aside className="space-y-4">
          <button onClick={() => setShowSim((v) => !v)} className="btn-subtle w-full">
            <GitCompare size={16} /> What if my schedule changes?
          </button>
          <WhatIf learnerId={learnerId!} currentStudy={path.study_time_per_week} open={showSim} />
          <div className="card p-4 text-sm text-muted">
            <p className="font-medium text-secondary">Phases</p>
            <ul className="mt-2 space-y-1">
              {phases.map(([name, steps]) => (
                <li key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span>{steps.length}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
            <motion.div
              className="relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6"
              initial={{ x: 80 }} animate={{ x: 0 }} exit={{ x: 80 }} transition={{ type: "tween", duration: 0.25 }}
            >
              <button onClick={() => setSelected(null)} className="absolute right-4 top-4 text-muted hover:text-primary"><X size={18} /></button>
              <span className="section-eyebrow">Why is this next?</span>
              <h2 className="mt-2 text-xl font-bold">{selected.resource.title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={selected.status} />
                <span className="pill capitalize">{selected.resource.type}</span>
                <span className="pill capitalize">{selected.resource.difficulty}</span>
                <span className="pill">{selected.estimated_hours} hrs</span>
              </div>

              <div className="mt-5 rounded-card border border-border bg-elevated p-4">
                {explainLoad ? <Loader2 className="animate-spin text-accent" /> : (
                  <p className="text-sm leading-relaxed text-primary">{explain?.message || selected.reason}</p>
                )}
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="meta mb-1">Skills you'll gain</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.skills_gained.map((s) => <span key={s} className="pill">{s.replace(/_/g, " ")}</span>)}
                  </div>
                </div>
                <div>
                  <p className="meta mb-1">Prerequisites</p>
                  <p className="text-sm text-secondary">{selected.prerequisites.length ? selected.prerequisites.join(", ") : "None — start anytime"}</p>
                </div>
                <div>
                  <p className="meta mb-1">Unlocks</p>
                  <p className="text-sm text-secondary">{selected.unlocks.length ? selected.unlocks.join(", ") : "Your goal"}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button onClick={() => startStep(selected)} disabled={startLoad} className="btn-primary flex-1">
                  {startLoad ? "Starting…" : `Start ${selected.resource.type}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WhatIf({ learnerId, currentStudy, open }: { learnerId: string; currentStudy: number; open: boolean }) {
  const [study, setStudy] = useState(3);
  const [sim, setSim] = useState<SimulateResponse | null>(null);
  const [load, setLoad] = useState(false);

  async function run() {
    setLoad(true);
    try {
      const r = await api.simulate(learnerId, { study_time_per_week: study });
      setSim(r);
    } finally { setLoad(false); }
  }

  if (!open) return null;
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-primary">What-if simulation</p>
      <p className="mt-1 text-xs text-muted">See how your path adapts without changing your real plan.</p>
      <div className="mt-3 flex items-center gap-2">
        <input type="range" min={1} max={20} value={study} onChange={(e) => setStudy(+e.target.value)} className="flex-1 accent-accent" />
        <span className="w-[80px] text-right text-sm text-secondary">{study} hrs/wk</span>
      </div>
      <button onClick={run} disabled={load} className="btn-subtle mt-3 w-full">{load ? "Simulating…" : "Run simulation"}</button>
      {sim && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Current</span><span className="text-secondary">{sim.current.timeline_months} mo · {sim.current.study_time_per_week} h/wk</span></div>
          <div className="flex justify-between"><span className="text-accent">Simulated</span><span className="text-accent">{sim.simulated.timeline_months} mo · {sim.simulated.study_time_per_week} h/wk</span></div>
          <ul className="mt-2 space-y-1 border-t border-border-subtle pt-2 text-xs text-secondary">
            {sim.changes_summary.map((c, i) => <li key={i}>• {c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
