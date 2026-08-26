import { useLearner } from "../store/useLearner";
import { useDashboard, usePath } from "../lib/hooks";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionHeader,
  Skeleton,
} from "../components/ui";
import { ProgressOverview } from "../components/product.panels";
import { GitBranch } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Progress() {
  const { learnerId } = useLearner();
  const navigate = useNavigate();
  const dash = useDashboard(learnerId);
  const path = usePath(dash.data?.path_id ?? null);

  if (dash.isLoading) return <Skeleton className="h-96" />;
  if (dash.isError)
    return <ErrorState description={(dash.error as Error)?.message} onRetry={() => dash.refetch()} />;
  if (!dash.data?.path_id)
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader eyebrow="Progress" title="Your progress" />
        <EmptyState
          title="No path to track yet"
          description="Build a learning path to start tracking progress."
          action={<Button onClick={() => navigate("/path")}>Open path</Button>}
          icon={<GitBranch size={28} />}
        />
      </div>
    );

  const steps = path.data?.steps ?? [];
  const completed = steps.filter((s) => s.status === "completed").length;
  const total = steps.length;
  const current = steps.find((s) => s.status === "current");

  return (
    <div>
      <PageHeader
        eyebrow="Progress"
        title="How far have you come?"
        description="Where you are, what you're doing now, and what's next."
      />

      <ProgressOverview
        pct={dash.data.path_complete_pct}
        completed={completed}
        total={total}
        currentStepTitle={current?.resource.title ?? dash.data.continue_resource?.title ?? null}
        skillsCovered={dash.data.skills_covered}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeader title="Step completion" />
          <Card className="bg-surface-secondary space-y-3">
            {steps.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-caption text-muted w-6 tabular-nums">{s.order + 1}</span>
                <span className="flex-1 truncate text-body-sm text-secondary">{s.resource.title}</span>
                <div className="h-2 w-28 rounded-full bg-surface-tertiary overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full"
                    style={{ width: `${s.completion_percentage}%` }}
                  />
                </div>
                <span className="text-caption text-muted w-9 text-right tabular-nums">
                  {s.completion_percentage}%
                </span>
              </div>
            ))}
            {steps.length === 0 && <p className="text-body-sm text-muted">No steps yet.</p>}
          </Card>
        </section>

        <section>
          <SectionHeader title="Skill coverage" description="Required vs current by skill." />
          <Card className="bg-surface-secondary space-y-3">
            {dash.data.skills.slice(0, 10).map((s) => {
              const pct = Math.max(0, Math.min(100, Math.round((s.level / Math.max(1, s.required)) * 100)));
              return (
                <div key={s.skill}>
                  <div className="flex justify-between text-caption mb-1">
                    <span className="text-secondary">{s.skill}</span>
                    <span className="text-muted tabular-nums">
                      {s.level}/{s.required}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: s.gap === 0 ? "var(--color-success)" : "var(--color-brand)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      </div>
    </div>
  );
}
