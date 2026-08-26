import { useNavigate } from "react-router-dom";
import { LogOut, Target, Clock, Flame } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useProfile } from "../lib/hooks";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
  SectionHeader,
  Skeleton,
} from "../components/ui";

export function Profile() {
  const { learnerId, profile, clearLearner } = useLearner();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useProfile(learnerId);

  if (!learnerId) return null;
  if (isLoading) return <Skeleton className="h-96" />;
  if (isError)
    return <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  if (!data) return null;

  const skills = Object.entries(data.current_skills).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title={data.name}
        description="Your navigation context — the inputs Astrolabe uses to build your path."
        actions={
          <Button
            variant="ghost"
            onClick={() => {
              clearLearner();
              navigate("/");
            }}
          >
            <LogOut size={16} /> Reset
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <SectionHeader title="Goal & direction" />
          <Row icon={<Target size={15} className="text-brand" />} label="Goal" value={data.goal || "—"} />
          <Row icon={<Target size={15} className="text-brand" />} label="Target role" value={data.target_role || "—"} />
          <Row icon={<Clock size={15} className="text-brand" />} label="Timeline" value={`${data.timeline_months} months`} />
          <Row icon={<Clock size={15} className="text-brand" />} label="Study time" value={`${data.study_time_per_week} h/week`} />
        </Card>

        <Card className="space-y-3">
          <SectionHeader title="Preferences" />
          <Row label="Experience" value={data.experience_level} />
          <Row label="Preferred pace" value={data.preferred_pace} />
          <Row label="Difficulty" value={data.difficulty_preference} />
          <Row label="Format" value={data.preferred_format} />
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
