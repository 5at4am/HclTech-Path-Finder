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
          <span className="font-display text-lg font-bold tracking-tight">Pathwise</span>
        </div>
        <Link to="/" className="text-sm text-secondary hover:text-primary">Cancel</Link>
      </header>

      <main className="container-page flex flex-1 flex-col items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-2xl"
        >
          <span className="section-eyebrow">Onboarding</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Where do you want to go?</h1>
          <p className="mt-3 text-secondary">
            Tell me what you're trying to achieve. You don't need to know what to learn yet.
          </p>

          <div className="mt-7 rounded-panel border border-border bg-surface p-4">
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
                  className="pill hover:border-accent/50 hover:text-primary"
                >
                  <Sparkles size={12} /> {ex}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
