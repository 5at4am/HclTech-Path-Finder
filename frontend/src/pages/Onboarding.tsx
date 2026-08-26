import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles, Plus, X, Clock, Sparkles as SparklesIcon } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useAnalyzeGoal, useCreateProfile } from "../lib/hooks";
import { api } from "../lib/api";
import type { GoalAnalysisResponse, ProfileCreate } from "../lib/types";
import { Button, Input, Textarea, Select, cx } from "../components/ui";

const STEPS = ["Goal", "Confirm", "About you", "Skills & Interests", "Preview"] as const;

const POPULAR_SKILLS = ["React", "Python", "JavaScript", "SQL", "HTML/CSS", "Git"];
const POPULAR_INTERESTS = ["React", "APIs", "Data Viz", "ML", "UI/UX", "Python", "SQL", "Next.js"];

const TRACK_PREVIEW = {
  Frontend: {
    badge: "6 months · 6h/week",
    nodes: [
      { k: "Current skills", items: ["HTML ✓", "CSS ✓"], tone: "success" as const },
      { k: "Foundations", items: ["JavaScript", "Responsive Design"], tone: "brand" as const },
      { k: "Core", items: ["React"], tone: "accent" as const },
      { k: "Goal", items: ["Frontend Engineer"], tone: "brand" as const },
    ],
  },
  Backend: {
    badge: "7 months · 8h/week",
    nodes: [
      { k: "Current skills", items: ["Python ✓", "SQL ✓"], tone: "success" as const },
      { k: "Foundations", items: ["APIs", "Databases"], tone: "brand" as const },
      { k: "Core", items: ["Node.js / Express"], tone: "accent" as const },
      { k: "Goal", items: ["Backend Engineer"], tone: "brand" as const },
    ],
  },
  "Data Science": {
    badge: "8 months · 6h/week",
    nodes: [
      { k: "Current skills", items: ["Python ✓", "SQL ✓"], tone: "success" as const },
      { k: "Foundations", items: ["Statistics", "Probability"], tone: "brand" as const },
      { k: "Core", items: ["Data Analysis"], tone: "accent" as const },
      { k: "Goal", items: ["Data Scientist"], tone: "brand" as const },
    ],
  },
  "AI/ML": {
    badge: "8 months · 6h/week",
    nodes: [
      { k: "Current skills", items: ["Python ✓", "SQL ✓"], tone: "success" as const },
      { k: "Foundations", items: ["Statistics", "Probability"], tone: "brand" as const },
      { k: "Core", items: ["Machine Learning"], tone: "accent" as const },
      { k: "Goal", items: ["AI / ML Engineer"], tone: "brand" as const },
    ],
  },
} as const;
type Track = keyof typeof TRACK_PREVIEW;

function domainToTrack(domain: string, fallback: string): Track {
  const d = domain.toLowerCase();
  const r = fallback.toLowerCase();
  if (d.includes("front") || r.includes("front")) return "Frontend";
  if (d.includes("back") || r.includes("back")) return "Backend";
  if (d.includes("data science") || r.includes("data sci")) return "Data Science";
  if (d.includes("machine") || d.includes("ai") || d.includes("ml") || r.includes("ai") || r.includes("ml")) return "AI/ML";
  if (d.includes("data")) return "Data Science";
  return "AI/ML";
}

function levelLabel(v: number) {
  if (v <= 25) return "Beginner";
  if (v <= 50) return "Intermediate";
  if (v <= 75) return "Advanced";
  return "Expert";
}
function levelColor(v: number) {
  if (v <= 25) return "var(--color-text-muted)";
  if (v <= 50) return "var(--orange-500)";
  if (v <= 75) return "var(--violet-500)";
  return "var(--green-400)";
}

const GOAL_EXAMPLES = ["Become a Frontend Engineer in 6 months", "Switch to Data Science in 8 months", "Become an AI/ML Engineer — build ML projects"];

export function Onboarding() {
  const navigate = useNavigate();
  const { setLearner } = useLearner();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    goal: "",
    target_role: "",
    timeline_months: 6,
    interests: "" as string,
    experience_level: "beginner",
    study_time_per_week: 6,
    preferred_pace: "moderate",
    difficulty_preference: "medium",
  });
  const [skills, setSkills] = useState<Array<{ name: string; level: number }>>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(50);
  const [interestInput, setInterestInput] = useState("");
  const [analysis, setAnalysis] = useState<GoalAnalysisResponse | null>(null);

  const analyze = useAnalyzeGoal();
  const createProfile = useCreateProfile();

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = step === 0 ? form.goal.trim().length > 2 : true;

  const goNext = async () => {
    if (step === 0) {
      const res = await analyze.mutateAsync(form.goal);
      setAnalysis(res);
      if (res.target_role && !form.target_role) setForm((f) => ({ ...f, target_role: res.target_role }));
      if (res.timeline_months && form.timeline_months === 6) setForm((f) => ({ ...f, timeline_months: res.timeline_months as number }));
      setStep(1);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const addSkill = () => {
    const name = newSkillName.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills((prev) => [...prev, { name, level: newSkillLevel }]);
    setNewSkillName("");
    setNewSkillLevel(50);
  };
  const addSuggestedSkill = (name: string) => {
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills((prev) => [...prev, { name, level: 50 }]);
  };
  const removeSkill = (name: string) => setSkills((prev) => prev.filter((s) => s.name !== name));

  const interestsList = form.interests
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const toggleInterest = (name: string) => {
    const has = interestsList.some((i) => i.toLowerCase() === name.toLowerCase());
    if (has) setForm((f) => ({ ...f, interests: interestsList.filter((i) => i.toLowerCase() !== name.toLowerCase()).join(", ") }));
    else setForm((f) => ({ ...f, interests: [...interestsList, name].join(", ") }));
  };
  const addInterest = () => {
    const v = interestInput.trim();
    if (!v) return;
    if (interestsList.some((i) => i.toLowerCase() === v.toLowerCase())) return;
    setForm((f) => ({ ...f, interests: [...interestsList, v].join(", ") }));
    setInterestInput("");
  };

  const finish = async () => {
    const current_skills: Record<string, number> = Object.fromEntries(skills.map((s) => [s.name, s.level]));
    const interests = form.interests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);
    const payload: ProfileCreate = {
      name: "Learner",
      goal: form.goal.trim(),
      target_role: form.target_role.trim() || analysis?.target_role || "Learner",
      timeline_months: Number(form.timeline_months) || 6,
      interests,
      experience_level: form.experience_level,
      current_skills,
      study_time_per_week: Number(form.study_time_per_week) || 6,
      preferred_pace: form.preferred_pace,
      difficulty_preference: form.difficulty_preference,
      objectives: analysis?.detected_skills ?? [],
    };
    const profile = await createProfile.mutateAsync(payload);
    setLearner(profile.learner_id, profile);
    await api.paths.generate(profile.learner_id);
    navigate(`/path`);
  };

  const track: Track = domainToTrack(analysis?.domain || "", form.target_role);

  return (
    <div className="min-h-screen bg-bg text-primary">
      <div className="container-page mx-auto px-6 py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <span className="text-title font-semibold">PadhAI</span>
          <span className="text-caption text-muted">
            Step {step + 1} / {STEPS.length} · {STEPS[step]}
          </span>
        </div>

        <div className="flex gap-1.5 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className={cx("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-surface-tertiary")} />
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <Section title="What do you want to achieve?" subtitle="Describe your goal in your own words. We'll understand it for you.">
              <label className="label">Your goal</label>
              <Textarea
                autoFocus
                rows={4}
                placeholder="e.g. I want to become a Frontend Engineer who can build production React apps in 6 months"
                value={form.goal}
                onChange={(e) => set("goal", e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {GOAL_EXAMPLES.map((ex) => (
                  <button key={ex} type="button" onClick={() => set("goal", ex)} className="pill text-xs">
                    {ex}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {step === 1 && (
            <Section title="We heard you — confirm" subtitle="Edit if we got anything wrong. This shapes your path.">
              {analyze.isPending && (
                <div className="flex items-center gap-2 text-secondary">
                  <Loader2 className="animate-spin" size={18} /> Understanding your goal…
                </div>
              )}
              {analysis && (
                <div className="space-y-4">
                  <div className="rounded-xl border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <p className="section-eyebrow mb-3">
                      <Sparkles size={13} className="text-brand" /> Detected
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label">Target role</label>
                        <Input value={form.target_role} onChange={(e) => set("target_role", e.target.value)} placeholder="e.g. Frontend Engineer" />
                      </div>
                      <div>
                        <label className="label">Timeline — {form.timeline_months} months</label>
                        <input
                          type="range"
                          min={1}
                          max={18}
                          value={form.timeline_months}
                          onChange={(e) => set("timeline_months", parseInt(e.target.value, 10))}
                          className="w-full accent-[var(--violet-500)]"
                        />
                        <div className="flex justify-between text-caption" style={{ color: "var(--color-text-muted)" }}>
                          <span>1 mo</span>
                          <span>18 mo</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-body-sm mt-4 capitalize" style={{ color: "var(--color-text-muted)" }}>
                      Domain: <span className="font-medium" style={{ color: "var(--color-text)" }}>{analysis.domain}</span>
                    </p>
                  </div>
                  {analysis.detected_skills.length > 0 && (
                    <div>
                      <p className="text-caption text-muted mb-2">Detected skills — will guide your path</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.detected_skills.map((s) => (
                          <span key={s} className="pill">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.missing_information.length > 0 && (
                    <p className="text-caption" style={{ color: "var(--color-text-muted)" }}>
                      We'll fine-tune later: {analysis.missing_information.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </Section>
          )}

          {step === 2 && (
            <Section title="About you" subtitle="3 quick picks — this calibrates difficulty and pace.">
              <div>
                <p className="label">Experience</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: "beginner", title: "Beginner", desc: "Starting fresh" },
                    { id: "intermediate", title: "Intermediate", desc: "Built 1–2 projects" },
                    { id: "advanced", title: "Advanced", desc: "Shipped to prod" },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => set("experience_level", o.id)}
                      className={cx(
                        "rounded-xl border p-4 text-left transition-colors",
                        form.experience_level === o.id ? "border-brand bg-brand-soft" : "border-default bg-surface hover:bg-surface-tertiary",
                      )}
                    >
                      <span className="font-medium text-sm">{o.title}</span>
                      <span className="block text-caption mt-1" style={{ color: "var(--color-text-muted)" }}>{o.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="label">Study time per week</p>
                <div className="flex gap-2">
                  {[3, 6, 10].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => set("study_time_per_week", h)}
                      className={cx("pill", Number(form.study_time_per_week) === h && "bg-brand text-white border-brand")}
                    >
                      {h}h / week
                    </button>
                  ))}
                  <span className="pill" style={{ opacity: 0.7 }}>
                    <Input type="number" min={1} max={80} value={form.study_time_per_week} onChange={(e) => set("study_time_per_week", parseInt(e.target.value || "6", 10))} className="h-6 w-16 px-1 border-0 bg-transparent p-0 text-center" />
                    custom
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Pace</label>
                  <Select value={form.preferred_pace} onChange={(e) => set("preferred_pace", e.target.value)}>
                    <option value="relaxed">Relaxed</option>
                    <option value="moderate">Moderate</option>
                    <option value="intensive">Intensive</option>
                  </Select>
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <Select value={form.difficulty_preference} onChange={(e) => set("difficulty_preference", e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </div>
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section title="Skills & Interests" subtitle="Pick what interests you, add what you already know. Both are optional.">
              <div>
                <label className="label">Interests</label>
                <div className="flex gap-2">
                  <Input placeholder="e.g. React" value={interestInput} onChange={(e) => setInterestInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(); } }} className="flex-1" />
                  <Button type="button" variant="secondary" onClick={addInterest} disabled={!interestInput.trim()}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {POPULAR_INTERESTS.map((s) => {
                    const active = interestsList.some((i) => i.toLowerCase() === s.toLowerCase());
                    return (
                      <button key={s} type="button" onClick={() => toggleInterest(s)} className={cx("pill text-xs", active && "bg-brand text-white border-brand")}>
                        {s} {active && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
                {interestsList.length > 0 && <p className="text-caption mt-2" style={{ color: "var(--color-text-muted)" }}>{interestsList.length} selected: {interestsList.join(", ")}</p>}
              </div>

              <div className="mt-8">
                <label className="label">Current skills</label>
                <div className="flex gap-2">
                  <Input placeholder="e.g. Python" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} className="flex-1" />
                  <Select value={String(newSkillLevel)} onChange={(e) => setNewSkillLevel(parseInt(e.target.value, 10))} className="w-[150px]">
                    <option value="25">Beginner</option>
                    <option value="50">Intermediate</option>
                    <option value="75">Advanced</option>
                    <option value="90">Expert</option>
                  </Select>
                  <Button
                    type="button"
                    onClick={() => { const n = newSkillName.trim(); if (!n) return; if (skills.some((s) => s.name.toLowerCase() === n.toLowerCase())) return; setSkills((p) => [...p, { name: n, level: newSkillLevel }]); setNewSkillName(""); }}
                    disabled={!newSkillName.trim()}
                  >
                    <Plus size={14} /> Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {POPULAR_SKILLS.map((s) => {
                    const added = skills.some((k) => k.name.toLowerCase() === s.toLowerCase());
                    return (
                      <button key={s} type="button" onClick={() => addSuggestedSkill(s)} disabled={added} className={cx("pill text-xs", added && "opacity-40 cursor-not-allowed")}>
                        {s} {added ? <Check size={12} /> : <Plus size={12} />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 min-h-[28px]">
                  {skills.length === 0 ? (
                    <p className="text-caption" style={{ color: "var(--color-text-muted)" }}>No skills yet — skip if starting fresh.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <span key={s.name} className="pill inline-flex items-center gap-2">
                          {s.name}
                          <span className="text-caption font-mono" style={{ color: levelColor(s.level) }}>{levelLabel(s.level)}</span>
                          <button type="button" onClick={() => removeSkill(s.name)} className="grid place-items-center h-5 w-5 rounded-full hover:bg-surface-tertiary" aria-label={`Remove ${s.name}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <button type="button" onClick={() => setSkills([])} className="text-caption hover:underline" style={{ color: "var(--color-text-muted)" }}>Clear</button>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section title="Ready to build?" subtitle="Here's a preview of your track — your real path will be personalized and ordered by prerequisites.">
              <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-caption font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Preview · {track}</span>
                  <span className="pill text-xs" style={{ background: "var(--violet-500)", color: "#fff", borderColor: "var(--violet-500)" }}>{TRACK_PREVIEW[track].badge}</span>
                </div>
                <div className="p-4 space-y-3">
                  {TRACK_PREVIEW[track].nodes.map((n, i) => (
                    <div key={n.k} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full mt-1" style={{ background: n.tone === "success" ? "var(--green-400)" : n.tone === "brand" ? "var(--violet-500)" : n.tone === "accent" ? "var(--orange-500)" : "var(--color-text-muted)" }} />
                        {i < TRACK_PREVIEW[track].nodes.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--color-border)" }} />}
                      </div>
                      <div className="pb-2">
                        <div className="text-caption font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{n.k}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {n.items.map((it) => (
                            <span key={it} className="pill text-xs" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{it}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t flex items-center justify-between text-caption" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-tertiary)", color: "var(--color-text-muted)" }}>
                  <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {Number(form.study_time_per_week) || 6}h/week personalized</span>
                  <span className="inline-flex items-center gap-1"><SparklesIcon size={13} style={{ color: "var(--violet-500)" }} /> Prerequisite-ordered</span>
                </div>
              </div>
              <p className="text-caption mt-3" style={{ color: "var(--color-text-muted)" }}>
                {analysis?.summary || "We'll sequence foundations first, then core, then your capstone."}
              </p>
            </Section>
          )}
        </motion.div>

        <div className="flex items-center justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={16} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext} disabled={!canNext || analyze.isPending}>
              {analyze.isPending && <Loader2 className="animate-spin" size={16} />}
              Continue <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={finish} disabled={createProfile.isPending}>
              {createProfile.isPending && <Loader2 className="animate-spin" size={16} />}
              Build my path <Check size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-heading-lg text-primary">{title}</h1>
      {subtitle && <p className="text-body text-secondary mt-2 mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}
