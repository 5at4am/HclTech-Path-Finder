import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles, Plus, X, Trash2, Lightbulb } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useAnalyzeGoal, useCreateProfile } from "../lib/hooks";
import { api } from "../lib/api";
import type { GoalAnalysisResponse, ProfileCreate } from "../lib/types";
import { Button, Input, Textarea, Select, cx } from "../components/ui";

const STEPS = [
  "Goal",
  "Target role",
  "Timeline",
  "Interests",
  "Experience",
  "Current skills",
  "Analysis",
];

const POPULAR_SKILLS = [
  "HTML",
  "CSS",
  "JavaScript",
  "React",
  "TypeScript",
  "Python",
  "SQL",
  "Node.js",
  "Git",
  "Data Analysis",
  "Machine Learning",
  "UI/UX",
];

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

function splitList(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function Onboarding() {
  const navigate = useNavigate();
  const { setLearner } = useLearner();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    goal: "",
    target_role: "",
    timeline_months: 6,
    interests: "",
    experience_level: "beginner",
    study_time_per_week: 6,
    preferred_pace: "moderate",
    difficulty_preference: "medium",
  });
  const [skills, setSkills] = useState<Array<{ name: string; level: number }>>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(50);
  const [analysis, setAnalysis] = useState<GoalAnalysisResponse | null>(null);

  const analyze = useAnalyzeGoal();
  const createProfile = useCreateProfile();

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const canNext =
    (step === 0 && form.goal.trim().length > 2) ||
    (step === 1 && form.target_role.trim().length > 1) ||
    step > 1;

  const goNext = async () => {
    if (step === STEPS.length - 2) {
      // moving into Analysis: run goal analysis
      const res = await analyze.mutateAsync(form.goal);
      setAnalysis(res);
      setStep((s) => s + 1);
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

  const addSuggested = (name: string) => {
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills((prev) => [...prev, { name, level: 50 }]);
  };

  const removeSkill = (name: string) => setSkills((prev) => prev.filter((s) => s.name !== name));
  const updateSkillLevel = (name: string, level: number) =>
    setSkills((prev) => prev.map((s) => (s.name === name ? { ...s, level } : s)));

  const finish = async () => {
    const current_skills: Record<string, number> = Object.fromEntries(skills.map((s) => [s.name, s.level]));
    const payload: ProfileCreate = {
      name: "Learner",
      goal: form.goal.trim(),
      target_role: form.target_role.trim(),
      timeline_months: Number(form.timeline_months) || 6,
      interests: splitList(form.interests),
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
    navigate(`/path`); // LearningPath resolves path_id from the dashboard
  };

  return (
    <div className="min-h-screen bg-bg text-primary">
      <div className="container-page mx-auto px-6 py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <span className="text-title font-semibold">PadhAI</span>
          <span className="text-caption text-muted">
            Step {step + 1} / {STEPS.length}
          </span>
        </div>

        {/* progress */}
        <div className="flex gap-1.5 mb-10">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cx(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-brand" : "bg-surface-tertiary",
              )}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <Section title="What do you want to achieve?" subtitle="Describe your learning goal in your own words.">
              <label className="label">Your goal</label>
              <Textarea
                autoFocus
                rows={4}
                placeholder="e.g. Become a frontend engineer who can build production React applications"
                value={form.goal}
                onChange={(e) => set("goal", e.target.value)}
              />
            </Section>
          )}

          {step === 1 && (
            <Section title="What role are you aiming for?" subtitle="This shapes the skills PadhAI prioritizes.">
              <label className="label">Target role</label>
              <Input
                autoFocus
                placeholder="e.g. Frontend Engineer"
                value={form.target_role}
                onChange={(e) => set("target_role", e.target.value)}
              />
            </Section>
          )}

          {step === 2 && (
            <Section title="What's your timeline?" subtitle="PadhAI uses this to pace your path.">
              <label className="label">Target timeline (months)</label>
              <Input
                type="number"
                min={1}
                max={60}
                value={form.timeline_months}
                onChange={(e) => set("timeline_months", parseInt(e.target.value || "6", 10))}
              />
            </Section>
          )}

          {step === 3 && (
            <Section title="What are you interested in?" subtitle="Comma-separated topics help tailor recommendations.">
              <label className="label">Interests</label>
              <Input
                placeholder="React, accessibility, design systems"
                value={form.interests}
                onChange={(e) => set("interests", e.target.value)}
              />
            </Section>
          )}

          {step === 4 && (
            <Section title="Tell us about you" subtitle="This calibrates difficulty and pace.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Experience level</label>
                  <Select value={form.experience_level} onChange={(e) => set("experience_level", e.target.value)}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </div>
                <div>
                  <label className="label">Study time / week (hours)</label>
                  <Input
                    type="number"
                    min={1}
                    max={80}
                    value={form.study_time_per_week}
                    onChange={(e) => set("study_time_per_week", parseInt(e.target.value || "6", 10))}
                  />
                </div>
                <div>
                  <label className="label">Preferred pace</label>
                  <Select value={form.preferred_pace} onChange={(e) => set("preferred_pace", e.target.value)}>
                    <option value="relaxed">Relaxed</option>
                    <option value="moderate">Moderate</option>
                    <option value="intensive">Intensive</option>
                  </Select>
                </div>
                <div>
                  <label className="label">Difficulty preference</label>
                  <Select
                    value={form.difficulty_preference}
                    onChange={(e) => set("difficulty_preference", e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </div>
              </div>
            </Section>
          )}

          {step === 5 && (
            <Section
              title="What do you already know?"
              subtitle="Add skills you already have and rate your confidence. Leave empty if you're starting fresh — we'll figure out the gaps."
            >
              {/* Add skill row */}
              <div className="rounded-xl border p-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <label className="label">Add a skill</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    autoFocus
                    placeholder="e.g. React, Python, SQL"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 sm:w-[220px]">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(parseInt(e.target.value, 10))}
                      className="flex-1 accent-[var(--violet-500)]"
                      aria-label="Skill level"
                    />
                    <span className="text-caption font-mono px-2 py-1 rounded-md border min-w-[56px] text-center" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)", color: levelColor(newSkillLevel) }}>
                      {newSkillLevel}%
                    </span>
                  </div>
                  <Button type="button" onClick={addSkill} disabled={!newSkillName.trim()} className="sm:w-auto">
                    <Plus size={16} /> Add
                  </Button>
                </div>
                <p className="text-caption mt-2 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
                  <Lightbulb size={13} /> Tip: <span style={{ color: levelColor(newSkillLevel) }}>{levelLabel(newSkillLevel)}</span> — drag to adjust before adding
                </p>
              </div>

              {/* Popular chips */}
              <div className="mt-4">
                <p className="text-caption font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>Quick add</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SKILLS.map((s) => {
                    const added = skills.some((k) => k.name.toLowerCase() === s.toLowerCase());
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSuggested(s)}
                        disabled={added}
                        className={cx(
                          "pill text-xs transition-colors",
                          added && "opacity-40 cursor-not-allowed",
                        )}
                      >
                        {s} {added ? <Check size={12} className="text-success" /> : <Plus size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Added skills */}
              <div className="mt-6">
                {skills.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: "var(--color-border-strong)", background: "var(--color-surface-tertiary)", color: "var(--color-text-muted)" }}>
                    <p className="text-body-sm">No skills added yet — perfect if you're starting fresh.</p>
                    <p className="text-caption mt-1">Added skills appear here with a slider to fine-tune your level.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-caption font-medium" style={{ color: "var(--color-text-muted)" }}>{skills.length} skill{skills.length > 1 ? "s" : ""} added</p>
                    {skills.map((s) => (
                      <div key={s.name} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">{s.name}</span>
                            <span className="text-caption font-mono px-2 py-0.5 rounded-full border" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)", color: levelColor(s.level) }}>
                              {s.level}% · {levelLabel(s.level)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={s.level}
                              onChange={(e) => updateSkillLevel(s.name, parseInt(e.target.value, 10))}
                              className="flex-1 accent-[var(--violet-500)]"
                              aria-label={`${s.name} level`}
                            />
                            <div className="h-2 flex-1 rounded-full overflow-hidden hidden sm:block" style={{ background: "var(--color-border)" }}>
                              <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${s.level}%`, background: levelColor(s.level) }} />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSkill(s.name)}
                          className="btn btn-ghost btn-icon self-start sm:self-center"
                          aria-label={`Remove ${s.name}`}
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setSkills([])} className="text-caption inline-flex items-center gap-1 hover:underline" style={{ color: "var(--color-text-muted)" }}>
                      <X size={12} /> Clear all
                    </button>
                  </div>
                )}
              </div>
            </Section>
          )}

          {step === 6 && (
            <Section title="Your detected direction" subtitle="Based on your goal, here's how PadhAI reads it.">
              {analyze.isPending && (
                <div className="flex items-center gap-2 text-secondary">
                  <Loader2 className="animate-spin" size={18} /> Analyzing your goal…
                </div>
              )}
              {analysis && (
                <div className="space-y-4">
                  <div className="rounded-panel border border-brand-soft bg-brand-muted p-5">
                    <p className="section-eyebrow mb-2">
                      <Sparkles size={13} className="text-brand" /> Detected direction
                    </p>
                    <p className="text-heading-sm text-primary">{analysis.target_role || form.target_role}</p>
                    <p className="text-body-sm text-secondary capitalize">
                      Domain: {analysis.domain}
                      {analysis.timeline_months ? ` · ~${analysis.timeline_months} months` : ""}
                    </p>
                  </div>
                  {analysis.summary && (
                    <p className="text-body text-secondary">{analysis.summary}</p>
                  )}
                  {analysis.detected_skills.length > 0 && (
                    <div>
                      <p className="text-caption text-muted mb-2">Detected skills</p>
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
                    <div>
                      <p className="text-caption text-muted mb-2">We may ask later</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.missing_information.map((s) => (
                          <span key={s} className="pill border-accent-soft text-accent">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}
        </motion.div>

        {/* nav */}
        <div className="flex items-center justify-between mt-10">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft size={16} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext} disabled={!canNext}>
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-heading-lg text-primary">{title}</h1>
      {subtitle && <p className="text-body text-secondary mt-2 mb-6">{subtitle}</p>}
      {children}
    </div>
  );
}
