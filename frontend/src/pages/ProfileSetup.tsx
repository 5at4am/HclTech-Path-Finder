import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Compass, Loader2, Pencil, Plus, X } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
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
      setTimeout(() => setStep((s) => s + 1), 180);
    } else {
      setTimeout(() => setShowConfirm(true), 200);
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
        <span className="text-lg font-bold">Pathwise</span>
      </header>

      <main className="container-page flex flex-1 flex-col items-center justify-center py-10">
        <div className="w-full max-w-xl">
          {!showConfirm ? (
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <p className="meta">Question {step + 1} of {QUESTIONS.length}</p>
                <div className="mt-2 rounded-card border border-border bg-accent-soft/40 px-4 py-3 text-sm text-secondary">
                  I understand your goal: <span className="text-primary font-medium">{role}</span>
                  {goalAnalysis?.timeline_months ? ` in ${goalAnalysis.timeline_months} months.` : "."} Before I build your path, I need to understand your starting point.
                </div>
                <h1 className="mt-6 font-display text-2xl font-bold tracking-tight">{QUESTIONS[step].q}</h1>
                <div className="mt-5 space-y-2">
                  {QUESTIONS[step].options.map((o) => (
                    <button key={o.label} onClick={() => choose(o.value)} className="flex w-full items-center justify-between rounded-btn border border-border bg-surface px-4 py-3 text-left text-primary hover:border-accent/50 hover:bg-hover">
                      {o.label}
                      <span className="text-muted">○</span>
                    </button>
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
      </main>
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
        {[["Goal", profile.goal], ["Target role", profile.target_role], ["Timeline", `${profile.timeline_months} months`], ["Study time", `${profile.study_time_per_week} hrs/week`], ["Experience", profile.experience_level]].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border-subtle py-2">
            <span className="text-sm text-muted">{k}</span>
            <span className="max-w-[60%] text-right text-sm font-medium text-primary">{v}</span>
          </div>
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
