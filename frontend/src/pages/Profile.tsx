import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Target, Clock, Flame, Pencil, Save } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useProfile, useUpdateProfile } from "../lib/hooks";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  PageHeader,
  SectionHeader,
  Select,
  Skeleton,
} from "../components/ui";

export function Profile() {
  const { learnerId, profile, clearLearner, setProfile } = useLearner();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useProfile(learnerId);
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ timeline_months: number; study_time_per_week: number; experience_level: string; preferred_pace: string; difficulty_preference: string } | null>(null);

  if (!learnerId) return null;
  if (isLoading) return <Skeleton className="h-96" />;
  if (isError)
    return <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  if (!data) return null;

  const skills = Object.entries(data.current_skills).sort((a, b) => b[1] - a[1]);

  const startEdit = () => {
    setForm({
      timeline_months: data.timeline_months,
      study_time_per_week: data.study_time_per_week,
      experience_level: data.experience_level,
      preferred_pace: data.preferred_pace,
      difficulty_preference: data.difficulty_preference,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!form || !learnerId) return;
    const payload = {
      name: data.name,
      goal: data.goal,
      target_role: data.target_role,
      timeline_months: form.timeline_months,
      interests: data.interests,
      experience_level: form.experience_level,
      current_skills: data.current_skills,
      completed_courses: data.completed_courses,
      objectives: data.objectives,
      study_time_per_week: form.study_time_per_week,
      preferred_format: data.preferred_format,
      preferred_pace: form.preferred_pace,
      difficulty_preference: form.difficulty_preference,
      learning_history: data.learning_history,
    };
    const updated = await update.mutateAsync({ learnerId, data: payload });
    setProfile(updated);
    setEditing(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title={data.name}
        description="Your navigation context — the inputs PadhAI uses to build your path."
        actions={
          <div className="flex gap-2">
            {!editing ? (
              <Button variant="secondary" onClick={startEdit}>
                <Pencil size={16} /> Edit
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button loading={update.isPending} onClick={saveEdit}>
                  <Save size={16} /> Save
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                clearLearner();
                navigate("/");
              }}
            >
              <LogOut size={16} /> Reset
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <SectionHeader title="Goal & direction" />
          <Row icon={<Target size={15} className="text-brand" />} label="Goal" value={data.goal || "—"} />
          <Row icon={<Target size={15} className="text-brand" />} label="Target role" value={data.target_role || "—"} />
          {!editing ? (
            <>
              <Row icon={<Clock size={15} className="text-brand" />} label="Timeline" value={`${data.timeline_months} months`} />
              <Row icon={<Clock size={15} className="text-brand" />} label="Study time" value={`${data.study_time_per_week} h/week`} />
            </>
          ) : (
            form && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="label">Timeline — {form.timeline_months} months</label>
                  <input type="range" min={1} max={24} value={form.timeline_months} onChange={(e) => setForm({ ...form, timeline_months: parseInt(e.target.value, 10) })} className="w-full accent-[var(--violet-500)]" />
                </div>
                <div>
                  <label className="label">Study time (h/week)</label>
                  <Input type="number" min={1} max={80} value={form.study_time_per_week} onChange={(e) => setForm({ ...form, study_time_per_week: parseInt(e.target.value || "6", 10) })} />
                </div>
              </div>
            )
          )}
        </Card>

        <Card className="space-y-3">
          <SectionHeader title="Preferences" />
          {!editing ? (
            <>
              <Row label="Experience" value={data.experience_level} />
              <Row label="Preferred pace" value={data.preferred_pace} />
              <Row label="Difficulty" value={data.difficulty_preference} />
              <Row label="Format" value={data.preferred_format} />
            </>
          ) : (
            form && (
              <div className="space-y-3">
                <div>
                  <label className="label">Experience</label>
                  <Select value={form.experience_level} onChange={(e) => setForm({ ...form, experience_level: e.target.value })}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Pace</label>
                    <Select value={form.preferred_pace} onChange={(e) => setForm({ ...form, preferred_pace: e.target.value })}>
                      <option value="relaxed">Relaxed</option>
                      <option value="moderate">Moderate</option>
                      <option value="intensive">Intensive</option>
                    </Select>
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <Select value={form.difficulty_preference} onChange={(e) => setForm({ ...form, difficulty_preference: e.target.value })}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </Select>
                  </div>
                </div>
              </div>
            )
          )}
          <div>
            <p className="text-caption text-muted mb-2">Interests</p>
            <div className="flex flex-wrap gap-1.5">
              {data.interests.length ? (
                data.interests.map((i) => (
                  <span key={i} className="pill">
                    {i}
                  </span>
                ))
              ) : (
                <span className="text-body-sm text-muted">None set</span>
              )}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeader title="Current skills" description={`${skills.length} tracked`} />
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {skills.map(([skill, lvl]) => (
              <div key={skill}>
                <div className="flex justify-between text-caption mb-1">
                  <span className="text-secondary">{skill}</span>
                  <span className="text-muted tabular-nums">{lvl}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${lvl}%` }} />
                </div>
              </div>
            ))}
            {skills.length === 0 && (
              <p className="text-body-sm text-muted">No current skills recorded.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-subtle pb-2 last:border-0">
      <span className="text-body-sm text-muted inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-body-sm text-primary text-right capitalize">{value}</span>
    </div>
  );
}
