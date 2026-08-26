import { useNavigate } from "react-router-dom";
import { Compass, GitBranch, Lightbulb, MessagesSquare, PlayCircle, TrendingUp } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useDashboard, useRecommendations, useGeneratePath } from "../lib/hooks";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionHeader,
  Skeleton,
  cx,
} from "../components/ui";
import { ResourceCard, RecommendationCard, SkillGapCard } from "../components/product.cards";
import { ProgressBar } from "../components/ui";

export function Dashboard() {
  const { learnerId } = useLearner();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useDashboard(learnerId);
  const recs = useRecommendations(learnerId);
  const generate = useGeneratePath(learnerId);

  if (isLoading) return <DashboardSkeleton />;
  if (isError)
    return (
      <ErrorState
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  if (!data) return null;

  if (!data.path_id) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader eyebrow="Dashboard" title="No learning path yet" />
        <EmptyState
          title="Define your goal and PadhAI will create your personalized path."
          description="Your path is selected deterministically from your goal, skills, and the evidence base."
          action={
            <Button loading={generate.isPending} onClick={() => generate.mutateAsync().then(() => refetch())}>
              Build my path
            </Button>
          }
          icon={<GitBranch size={28} />}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={
          <span>
            {data.name ? `${data.name}'s navigation` : "Your navigation"}
          </span>
        }
        description={data.goal}
        actions={
          <Button variant="secondary" onClick={() => navigate("/path")}>
            <GitBranch size={16} /> Open path
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat label="Path progress" value={`${data.path_complete_pct}%`} icon={<TrendingUp size={16} className="text-brand" />} />
        <Stat label="Skills covered" value={data.skills_covered} icon={<Compass size={16} className="text-brand" />} />
        <Stat label="Active days" value={String(data.streak_days)} icon={<PlayCircle size={16} className="text-brand" />} />
        <Stat label="Hours this week" value={String(data.hours_this_week)} icon={<TrendingUp size={16} className="text-brand" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Primary: continue + next actions */}
        <section className="space-y-6">
          <div>
            <SectionHeader title="Continue where you left off" />
            {data.continue_resource ? (
              <ResourceCard
                resource={data.continue_resource}
                footer={
                  <div className="flex items-center gap-3">
                    <ProgressBar value={data.continue_pct} className="flex-1" />
                    <span className="text-caption text-muted tabular-nums">{data.continue_pct}%</span>
                  </div>
                }
              />
            ) : (
              <Card className="text-body-sm text-secondary">
                Your path is complete — explore electives or review.
              </Card>
            )}
          </div>

          <div>
            <SectionHeader title="What to do next" />
            <Card className="bg-surface-secondary">
              <ul className="space-y-2">
                {data.next_actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-body-sm text-secondary">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* Secondary: skill gap + mentor */}
        <section className="space-y-6">
          <div>
            <SectionHeader
              title="Priority skill gaps"
              action={
                <Button variant="ghost" size="sm" onClick={() => navigate("/skill-gap")}>
                  View all
                </Button>
              }
            />
            <div className="space-y-3">
              {data.priority_gaps.length === 0 && (
                <Card className="text-body-sm text-secondary">No major gaps detected.</Card>
              )}
              {data.priority_gaps.slice(0, 3).map((g) => (
                <SkillGapCard
                  key={g.skill}
                  skill={g.skill}
                  level={g.current_level}
                  required={g.current_level + g.gap}
                  gap={g.gap}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Mentor" />
            <Card className="flex items-center gap-3">
              <MessagesSquare size={20} className="text-brand" />
              <div className="flex-1">
                <p className="text-body-sm text-primary">Ask about your path</p>
                <p className="text-caption text-muted">Contextual, grounded in your progress.</p>
              </div>
              <Button size="sm" onClick={() => navigate("/mentor")}>
                Open
              </Button>
            </Card>
          </div>
        </section>
      </div>

      {/* Evidence-backed recommendations */}
      <div className="mt-10">
        <SectionHeader
          title="Evidence-backed recommendations"
          description="A preview — see the full reasoning on the Recommendations page."
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/recommendations")}>
              <Lightbulb size={14} /> All recommendations
            </Button>
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          {(recs.data?.recommendations ?? []).slice(0, 2).map((r) => (
            <RecommendationCard key={r.resource.id} rec={r} />
          ))}
          {recs.isLoading && (
            <>
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </>
          )}
          {!recs.isLoading && (recs.data?.recommendations.length ?? 0) === 0 && (
            <Card className="text-body-sm text-secondary md:col-span-2">
              No recommendations yet.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className={cx("flex items-center gap-3")}>
      <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-soft">{icon}</div>
      <div>
        <p className="text-caption text-muted">{label}</p>
        <p className="text-title text-primary tabular-nums">{value}</p>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-1/2" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}
