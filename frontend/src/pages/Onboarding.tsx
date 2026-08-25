import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Sparkles, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";

const EXAMPLES = [
  "Become a frontend developer in 6 months",
  "Prepare for a data science role",
  "Learn GenAI from scratch",
  "Build a machine learning portfolio",
  "Prepare for a cloud certification",
];

function GoalPreview({ goal }: { goal: string }) {
  const has = goal.trim().length > 0;
  return (
    <div className="sticky top-8 rounded-panel border border-border bg-surface p-6">
      <p className="section-eyebrow">Live preview</p>
      <p className="mt-2 text-sm text-muted">Your path takes shape as you type.</p>
      {has ? (
        <div className="mt-4">
          <p className="meta">Goal</p>
          <p className="mt-1 font-mono text-sm leading-relaxed text-primary">{goal.trim()}</p>
          <div className="mt-4 space-y-2">
            {["Target role", "Timeline", "First steps"].map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <span className="text-muted">{label}</span>
                <span className="text-primary/50">— extracted on submit</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-btn border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
          Start typing your goal — the role, timeline, and first steps will map here live.
        </div>
      )}
    </div>
  );
}

export default function Onboarding() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setGoalAnalysis, setProfileDraft } = useApp();

  async function submit(text: string) {
    const g = text.trim();
    if (!g) return;
    setLoading(true);
    setError("");
    try {
      const analysis = await api.analyzeGoal(g);
      setGoalAnalysis(analysis);
      setProfileDraft({ goal: analysis.goal, target_role: analysis.target_role, objectives: analysis.objectives });
      navigate("/profile");
    } catch (e) {
      setError((e as Error).message || "Could not analyze your goal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <header className="container-page flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-[32px] w-[32px] place-items-center rounded-btn bg-route text-white"><Compass size={18} /></span>
          <span className="font-display text-lg font-bold tracking-tight">Astrolabe</span>
        </div>
        <Link to="/" className="text-sm text-secondary hover:text-primary">Cancel</Link>
      </header>

      <main className="container-page relative grid flex-1 gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:pt-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="aurora-blob animate-aurora left-[10%] top-[10%] h-72 w-72 bg-accent/15" />
          <div className="aurora-blob animate-aurora-slow bottom-[8%] right-[12%] h-64 w-64 bg-accent-soft" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative w-full"
        >
          <span className="section-eyebrow">Onboarding</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Where do you want to go?</h1>
          <p className="mt-3 text-secondary">
            Tell me what you're trying to achieve. You don't need to know what to learn yet.
          </p>

          <div className="glass mt-7 rounded-panel p-4">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={4}
              placeholder="I want to become an AI/ML engineer within 8 months and build projects that will help me get a job."
              className="w-full resize-none bg-transparent text-lg text-primary outline-none placeholder:text-muted"
            />
            <div className="mt-3 flex justify-end">
              <button onClick={() => submit(goal)} disabled={loading || !goal.trim()} className="btn-primary disabled:opacity-40">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <>Build my path <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-error">{error}</p>}

          <div className="mt-7">
            <p className="meta mb-2">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <motion.button
                  key={ex}
                  onClick={() => submit(ex)}
                  whileTap={{ scale: 0.96 }}
                  className="pill hover:border-accent-soft hover:text-primary"
                >
                  <Sparkles size={12} /> {ex}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="relative hidden lg:block">
          <GoalPreview goal={goal} />
        </div>
      </main>
    </div>
  );
}
