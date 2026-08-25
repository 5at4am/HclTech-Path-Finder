import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2, Compass } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";

const STAGES = [
  "Understanding your goal",
  "Analyzing your skills",
  "Finding skill gaps",
  "Mapping prerequisites",
  "Ranking learning resources",
  "Building your learning path",
];

/* Miniature of the landing hero's route line — fills as pipeline stages complete,
   keeping one visual motif from marketing site through onboarding. */
function RouteProgress({ total, completed }: { total: number; completed: number }) {
  return (
    <svg viewBox="0 0 320 24" className="my-6 w-full" aria-hidden>
      <defs>
        <linearGradient id="analyzingRoute" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--color-brand-active)" />
        <stop offset="100%" stopColor="var(--color-brand)" />
        </linearGradient>
      </defs>
       <line x1="10" y1="12" x2="310" y2="12" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
      <motion.line
        x1="10" y1="12" x2="310" y2="12"
        stroke="url(#analyzingRoute)" strokeWidth="2" strokeLinecap="round"
        initial={false}
        animate={{ pathLength: total === 0 ? 0 : completed / total }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {Array.from({ length: total }).map((_, i) => (
        <circle
          key={i}
          cx={10 + i * (300 / (total - 1))}
          cy="12"
          r="4"
          className={i < completed ? "fill-success" : "fill-elevated"}
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

export default function Analyzing() {
  const navigate = useNavigate();
  const { learnerId, setPathId } = useApp();
  const [done, setDone] = useState<boolean[]>(STAGES.map(() => false));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!learnerId) {
      navigate("/onboarding");
      return;
    }
    let cancelled = false;
    (async () => {
      for (let i = 0; i < STAGES.length; i++) {
        await new Promise((r) => setTimeout(r, i === STAGES.length - 1 ? 500 : 650));
        if (cancelled) return;
        setDone((d) => d.map((v, idx) => (idx <= i ? true : v)));
        if (i === STAGES.length - 1) {
          // building: call the real backend
          try {
            const path = await api.generatePath(learnerId);
            if (cancelled) return;
            setPathId(path.path_id);
            setTimeout(() => !cancelled && navigate("/path"), 600);
          } catch (e) {
            if (!cancelled) setError((e as Error).message || "Could not generate your path.");
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [learnerId, navigate, setPathId]);

  return (
    <div className="app-bg grid min-h-screen place-items-center">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-[32px] w-[32px] place-items-center rounded-btn bg-route text-white"><Compass size={18} /></span>
          <span className="font-display text-lg font-bold tracking-tight">Astrolabe</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Mapping your route</h1>
        <p className="mt-2 text-secondary">We're turning your goal into a sequenced learning path.</p>

        <RouteProgress total={STAGES.length} completed={done.filter(Boolean).length} />

        <ul className="mt-8 space-y-3">
          {STAGES.map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
              className="flex items-center gap-3"
            >
              <span className={`grid h-6 w-6 place-items-center rounded-full border ${done[i] ? "border-success bg-success/15 text-success" : "border-border text-muted"}`}>
                {done[i] ? <Check size={14} /> : (i === STAGES.length - 1 && done[STAGES.length - 2] ? <Loader2 size={14} className="animate-spin" /> : null)}
              </span>
              <span className={done[i] ? "text-primary" : "text-muted"}>{s}</span>
              {done[i] && i < STAGES.length - 1 && <span className="ml-auto text-xs text-success">✓</span>}
            </motion.li>
          ))}
        </ul>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-btn border border-error/30 bg-error/5 p-4 text-sm text-error">
            {error}
            <button onClick={() => navigate("/profile")} className="btn-ghost mt-3">Back to profile</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
