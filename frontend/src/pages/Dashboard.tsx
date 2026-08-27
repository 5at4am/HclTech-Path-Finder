import { useNavigate } from "react-router-dom";
import { Clock, Compass, GitBranch, Lightbulb, MessagesSquare, PlayCircle, Sparkles, Target, TrendingUp, Unlock } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useDashboard, useRecommendations, useGeneratePath, usePath } from "../lib/hooks";
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
import { RecommendationCard, SkillGapCard } from "../components/product.cards";
import { Badge, ProgressBar } from "../components/ui";

export function Dashboard() {
  const { learnerId } = useLearner();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useDashboard(learnerId);
  const recs = useRecommendations(learnerId);
  const generate = useGeneratePath(learnerId);
  const path = usePath(data?.path_id ?? null);
  const continueStepId = (() => {
    if (!data?.continue_resource || !path.data) return null;
    const rid = data.continue_resource.id;
    const hit = path.data.steps.find((s) => s.resource_id === rid);
    return hit?.id ?? null;
  })();

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
              <ContinueCard
                resource={data.continue_resource}
                pct={data.continue_pct}
                remaining={data.continue_remaining_hours}
                unlocks={data.continue_unlocks}
                reason={data.continue_reason}
                studyPerWeek={data.study_time_per_week}
                onOpen={() =>
                  continueStepId && data.path_id
                    ? navigate(`/path/${data.path_id}/step/${continueStepId}`)
                    : navigate("/path")
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
                {data.next_actions.map((a, i) => {
                  const isResume = a.startsWith("Resume:");
                  const isGap = a.startsWith("Gap focus:");
                  return (
                    <li key={i} className="flex items-start gap-2 text-body-sm">
                      <span className={cx("mt-1 h-1.5 w-1.5 rounded-full shrink-0", isResume ? "bg-brand" : isGap ? "bg-accent" : "bg-muted")} />
                      <span className={isResume ? "text-primary font-medium" : isGap ? "text-accent" : "text-secondary"}>{a}</span>
                    </li>
                  );
                })}
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

function ContinueCard({
  resource,
  pct,
  remaining,
  unlocks,
  reason,
  studyPerWeek,
  onOpen,
}: {
  resource: { title: string; domain: string; difficulty: string; duration_hours: number; skills_gained: string[]; phase: string; type: string; rating: number };
  pct: number;
  remaining: number;
  unlocks: string[];
  reason: string;
  studyPerWeek: number;
  onOpen: () => void;
}) {
  const weeks = remaining > 0 ? (remaining / Math.max(1, studyPerWeek)).toFixed(1) : "0";
  const why = reason ? reason.slice(0, 110) : `Closes gap in ${(resource.skills_gained.slice(0, 2).join(", ") || resource.domain).replace(/_/g, " ")}`;
  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge tone="brand">{resource.domain}</Badge>
              <span className="text-caption text-muted">{resource.phase}</span>
              <Badge tone={resource.difficulty === "beginner" ? "success" : resource.difficulty === "advanced" ? "warning" : "brand"}>{resource.difficulty}</Badge>
              <span className="meta inline-flex items-center gap-1"><Clock size={12} />{resource.duration_hours}h total</span>
            </div>
            <h3 className="text-title text-primary leading-snug">{resource.title}</h3>
          </div>
          <Button size="sm" onClick={onOpen}><GitBranch size={14} /> Open</Button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ProgressBar value={pct} className="flex-1" />
          <span className="text-caption font-medium tabular-nums">{pct}%</span>
          <span className="text-caption text-muted">· {remaining}h left · {weeks}w @ {studyPerWeek}h/w</span>
        </div>

        <ul className="mt-4 space-y-2">
          <li className="flex gap-2 text-body-sm leading-snug">
            <Target size={14} className="text-brand mt-0.5 shrink-0" />
            <span className="text-secondary"><span className="font-medium text-primary">Why now:</span> {why}</span>
          </li>
          <li className="flex gap-2 text-body-sm leading-snug">
            <Clock size={14} className="text-muted mt-0.5 shrink-0" />
            <span className="text-secondary"><span className="font-medium text-primary">Cost:</span> {remaining}h left · {resource.difficulty} · {weeks} weeks at {studyPerWeek}h/week</span>
          </li>
          <li className="flex gap-2 text-body-sm leading-snug">
            <Unlock size={14} className="text-success mt-0.5 shrink-0" />
            <span className="text-secondary"><span className="font-medium text-primary">Leverage:</span> {unlocks.length ? `Unlocks ${unlocks.join(", ")}` : "Unlocks next phase — keep momentum"}</span>
          </li>
        </ul>

        {resource.skills_gained.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {resource.skills_gained.slice(0, 4).map((s) => (
              <span key={s} className="pill text-caption"><Sparkles size={11} /> {s.replace(/_/g, " ")}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
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
