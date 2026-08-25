import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Compass, Loader2, Pencil, Plus, X } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { cx } from "../components/ui";
import type { ProfileData } from "../lib/types";

interface Answer {
  python: number;
  study: number;
  outcome: string;
}

const QUESTIONS = [
  {
    key: "python" as const,
    q: "How much experience do you have with coding / the core skills of this field?",
    options: [
      { label: "Just getting started", value: 30 },
      { label: "Some basics", value: 50 },
      { label: "Can build things", value: 70 },
      { label: "Advanced", value: 90 },
    ],
  },
  {
    key: "study" as const,
    q: "How much time can you study each week?",
    options: [
      { label: "Less than 3 hours", value: 2 },
      { label: "3–6 hours", value: 5 },
      { label: "6–10 hours", value: 8 },
      { label: "10+ hours", value: 12 },
    ],
  },
  {
    key: "outcome" as const,
    q: "What's your primary outcome?",
    options: [
      { label: "Get a job", value: "job preparation" },
      { label: "Build projects", value: "portfolio" },
      { label: "Academic learning", value: "academic learning" },
      { label: "Certification", value: "certification" },
      { label: "Explore the field", value: "explore the field" },
    ],
  },
];

const INTEREST_SUGGESTIONS: Record<string, string[]> = {
  "Frontend Developer": ["Web Development", "JavaScript", "UI/UX Design", "React"],
  "Backend Developer": ["APIs", "Databases", "System Design", "Cloud"],
  "Full Stack Developer": ["Web Development", "React", "Node.js", "Databases"],
  "Mobile Developer": ["Mobile Apps", "Flutter", "Swift", "Android"],
  "Data Analyst": ["Data Analysis", "Visualization", "SQL", "Excel"],
  "Data Scientist": ["Machine Learning", "Statistics", "Python", "Data"],
  "AI/ML Engineer": ["Machine Learning", "Deep Learning", "Python", "MLOps"],
  "GenAI Engineer": ["LLMs", "RAG", "Prompt Engineering", "Agents"],
  "Cloud Engineer": ["AWS", "Kubernetes", "DevOps", "Linux"],
  "DevOps Engineer": ["CI/CD", "Docker", "Kubernetes", "Automation"],
  "Security Engineer": ["Cybersecurity", "Ethical Hacking", "Networking"],
  "Blockchain Developer": ["Blockchain", "Solidity", "Web3", "Smart Contracts"],
  "Software Engineer": ["Software Engineering", "Algorithms", "System Design"],
};

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { goalAnalysis, profileDraft, setProfileDraft, setLearnerId } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answer>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const goal = goalAnalysis?.goal || profileDraft?.goal || "";
  const role = goalAnalysis?.target_role || profileDraft?.target_role || "Software Engineer";

  const suggestions = INTEREST_SUGGESTIONS[role] || ["Software Engineering", "Problem Solving"];
  const [interests, setInterests] = useState<string[]>(suggestions);
  const [draftInterest, setDraftInterest] = useState("");

  function choose(value: number | string) {
    const key = QUESTIONS[step].key;
    setAnswers((a) => ({ ...a, [key]: value as any }));
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setShowConfirm(true);
    }
  }

  function addInterest() {
    const v = draftInterest.trim();
    if (v && !interests.includes(v)) setInterests((i) => [...i, v]);
    setDraftInterest("");
  }
  function removeInterest(v: string) {
    setInterests((i) => i.filter((x) => x !== v));
  }

  function buildProfile(): ProfileData {
    const comfort = answers.python ?? 50;
    const study = answers.study ?? 6;
    const outcome = (answers.outcome as string) || "explore the field";
    const experience = comfort >= 90 ? "advanced" : comfort >= 70 ? "intermediate" : comfort >= 50 ? "beginner" : "beginner";
    const difficulty = experience === "advanced" ? "hard" : experience === "intermediate" ? "medium" : "easy";

    const lvl = comfort >= 90 ? 90 : comfort >= 70 ? 70 : comfort >= 50 ? 55 : 40;
    const current_skills: Record<string, number> = { python: Math.round(lvl * 0.8) };
    (goalAnalysis?.detected_skills || []).forEach((s) => { current_skills[s] = lvl; });

    return {
      name: "Satyam",
      goal,
      target_role: role,
      timeline_months: goalAnalysis?.timeline_months ?? 6,
      interests: interests.length ? interests : suggestions,
      experience_level: experience,
      current_skills,
      completed_courses: [],
      objectives: [...new Set([...(goalAnalysis?.objectives || []), outcome])],
      study_time_per_week: study,
      preferred_format: "video",
      preferred_pace: study <= 3 ? "slow" : study >= 10 ? "fast" : "moderate",
      difficulty_preference: difficulty,
      learning_history: [],
    };
  }

  async function generate() {
    setSaving(true);
    setError("");
    try {
      const profile = buildProfile();
      setProfileDraft(profile);
      const res = await api.createProfile(profile);
      setLearnerId(res.learner_id);
      navigate("/analyzing");
    } catch (e) {
      setError((e as Error).message || "Could not create your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (!goal) {
    return (
      <div className="app-bg grid min-h-screen place-items-center text-secondary">
        Start by telling us your goal. <button onClick={() => navigate("/onboarding")} className="btn-ghost ml-3">Go to onboarding</button>
      </div>
    );
  }

  return (
    <div className="app-bg flex min-h-screen flex-col">
      <header className="container-page flex items-center gap-2 py-5">
        <span className="grid h-[32px] w-[32px] place-items-center rounded-btn bg-route text-white"><Compass size={18} /></span>
        <span className="font-display text-lg font-bold tracking-tight">Astrolabe</span>
      </header>

      <main className="container-page grid flex-1 gap-10 py-10 lg:grid-cols-[1fr_0.85fr] lg:items-start lg:pt-12">
        <div className="w-full">
          {!showConfirm ? (
            <AnimatePresence mode="popLayout">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                {/* route-progress: completed segments turn teal (we now know
                    this), the active one is violet, upcoming stay hairline. */}
                <div className="flex items-center gap-1.5" aria-hidden>
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                      <motion.div
                        className={cx("h-full rounded-full", i < step ? "bg-progress" : i === step ? "bg-accent" : "bg-border")}
                        style={{ width: "100%", transformOrigin: "left" }}
                        initial={false}
                        animate={{ scaleX: i < step ? 1 : i === step ? 0.45 : 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>
                  ))}
                </div>
                <p className="meta mt-3">Question {step + 1} of {QUESTIONS.length}</p>
                <div className="mt-2 rounded-card border border-border bg-accent-soft px-4 py-3 text-sm text-secondary">
                  I understand your goal: <span className="text-primary font-medium">{role}</span>
                  {goalAnalysis?.timeline_months ? ` in ${goalAnalysis.timeline_months} months.` : "."} Before I build your path, I need to understand your starting point.
                </div>
                <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">{QUESTIONS[step].q}</h1>
                <div className="mt-5 space-y-2">
                  {QUESTIONS[step].options.map((o) => (
                    <motion.button
                      key={o.label}
                      onClick={() => choose(o.value)}
                      whileTap={{ scale: 0.98 }}
                      className="group flex w-full items-center justify-between rounded-btn border border-border bg-surface px-4 py-3 text-left text-primary transition-colors hover:border-accent-soft hover:bg-hover"
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-5 w-5 place-items-center rounded-full border border-border text-accent transition-colors group-hover:border-accent">
                          <Check size={12} className="opacity-0 transition-opacity group-hover:opacity-70" />
                        </span>
                        {o.label}
                      </span>
                      <ArrowRight size={14} className="text-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <Confirmation
              profile={buildProfile()}
              interests={interests}
              onAddInterest={addInterest}
              onRemoveInterest={removeInterest}
              draftInterest={draftInterest}
              setDraftInterest={setDraftInterest}
              onEdit={() => { setShowConfirm(false); setStep(0); }}
              onGenerate={generate}
              saving={saving}
              error={error}
            />
          )}
        </div>

        <div className="relative hidden lg:block">
          <ProfilePreview
            goal={goal}
            role={role}
            answers={answers}
            interests={interests}
            step={showConfirm ? QUESTIONS.length : step}
          />
        </div>
      </main>
    </div>
  );
}

function experienceLabel(v?: number | string) {
  const comfort = typeof v === "number" ? v : 50;
  return comfort >= 90 ? "Advanced" : comfort >= 70 ? "Intermediate" : "Beginner";
}

/* Live-building profile preview — mirrors exactly what the system has learned
   so far, with dashed placeholders for what's still unanswered. Reinforces
   "the product is assembling something as you go." */
function ProfilePreview({ goal, role, answers, interests, step }: {
  goal: string; role: string; answers: Partial<Answer>; interests: string[]; step: number;
}) {
  const outcomeLabel =
    typeof answers.outcome === "string"
      ? QUESTIONS[2].options.find((o) => o.value === answers.outcome)?.label ?? answers.outcome
      : null;
  const rows: { label: string; value: string | null }[] = [
    { label: "Goal", value: goal.trim() || null },
    { label: "Target role", value: role },
    { label: "Experience", value: answers.python !== undefined ? experienceLabel(answers.python) : null },
    { label: "Study time", value: answers.study !== undefined ? `${answers.study} hrs/week` : null },
    { label: "Outcome", value: outcomeLabel },
  ];
  return (
    <div className="sticky top-8 rounded-panel border border-border bg-surface p-6">
      <p className="section-eyebrow">Building your profile</p>
      <p className="mt-2 text-sm text-muted">Fills in as you answer. Question {Math.min(step, 3)} of 3.</p>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="border-b border-border-subtle pb-3 last:border-0">
            <p className="meta">{r.label}</p>
            {r.value ? (
              <p className="mt-1 font-mono text-sm text-primary">{r.value}</p>
            ) : (
              <p className="mt-1 text-sm text-muted/60">—</p>
            )}
          </div>
        ))}
        <div>
          <p className="meta">Interests</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {interests.map((it) => (
              <span key={it} className="pill">{it}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Confirmation({ profile, interests, onAddInterest, onRemoveInterest, draftInterest, setDraftInterest, onEdit, onGenerate, saving, error }: {
  profile: ProfileData; interests: string[];
  onAddInterest: () => void; onRemoveInterest: (v: string) => void;
  draftInterest: string; setDraftInterest: (v: string) => void;
  onEdit: () => void; onGenerate: () => void; saving: boolean; error: string;
}) {
  const gaps = Object.entries(profile.current_skills).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([k]) => k);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <span className="section-eyebrow">Profile summary</span>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Here's what I understand about you</h1>

      <div className="mt-5 space-y-3">
        {([["Goal", profile.goal], ["Target role", profile.target_role], ["Timeline", `${profile.timeline_months} months`], ["Study time", `${profile.study_time_per_week} hrs/week`], ["Experience", profile.experience_level]] as const).map(([k, v], i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="flex justify-between border-b border-border-subtle py-2"
          >
            <span className="text-sm text-muted">{k}</span>
            <span className="max-w-[60%] text-right text-sm font-medium text-primary">{v}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-5">
        <label className="text-sm font-medium text-secondary">Your interests</label>
        <p className="text-xs text-muted">Edit these — they steer your recommendations. Add anything you care about.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {interests.map((it) => (
            <span key={it} className="pill flex items-center gap-1">
              {it}
              <button onClick={() => onRemoveInterest(it)} className="text-muted hover:text-error"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={draftInterest}
            onChange={(e) => setDraftInterest(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddInterest(); } }}
            placeholder="Add an interest (e.g. game dev, finance, robotics)"
            className="input"
          />
          <button onClick={onAddInterest} className="btn-subtle shrink-0"><Plus size={15} /> Add</button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-error">{error}</p>}

      <div className="mt-7 flex gap-3">
        <button onClick={onGenerate} disabled={saving} className="btn-primary">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Generating…</> : <>Generate my learning path <ArrowRight size={16} /></>}
        </button>
        <button onClick={onEdit} className="btn-ghost"><Pencil size={15} /> Edit profile</button>
      </div>
    </motion.div>
  );
}
