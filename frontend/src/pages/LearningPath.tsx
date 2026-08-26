import { useNavigate } from "react-router-dom";
import { GitBranch, SlidersHorizontal, Sparkles } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useDashboard, usePath, useGeneratePath } from "../lib/hooks";
import { api } from "../lib/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Badge,
} from "../components/ui";
import { LearningPath, CoverageSummary } from "../components/product.paths";

export function LearningPathPage() {
  const { learnerId } = useLearner();
  const navigate = useNavigate();
  const dash = useDashboard(learnerId);
  const pathId = dash.data?.path_id ?? null;
  const path = usePath(pathId);
  const generate = useGeneratePath(learnerId);

  if (dash.isLoading) return <Skeleton className="h-96" />;
  if (dash.isError)
    return (
      <ErrorState description={(dash.error as Error)?.message} onRetry={() => dash.refetch()} />
    );
  if (!pathId)
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader eyebrow="Learning path" title="Your path" />
        <EmptyState
          title="No learning path yet"
          description="Astrolabe sequences your resources into a navigable path ordered by prerequisites and your goals."
          action={
            <Button loading={generate.isPending} onClick={() => generate.mutateAsync().then(() => dash.refetch())}>
              Build my path
            </Button>
          }
          icon={<GitBranch size={28} />}
        />
      </div>
    );

  if (path.isLoading) return <Skeleton className="h-96" />;
  if (path.isError)
    return <ErrorState description={(path.error as Error)?.message} onRetry={() => path.refetch()} />;
  if (!path.data) return null;

  const p = path.data;

  return (
    <div>
      <PageHeader
        eyebrow="Learning path"
        title={p.goal || "Your path"}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {p.target_role && <Badge tone="brand">{p.target_role}</Badge>}
            <span className="text-muted">~{p.timeline_months} months</span>
            <span className="text-muted">· {p.study_time_per_week}h/week</span>
            <span className="text-muted">· {p.steps.length} steps</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                const next = await api.paths.adapt(p.path_id);
                path.refetch();
                navigate(`/path`);
              }}
            >
              <SlidersHorizontal size={16} /> Adapt
            </Button>
            <Button onClick={() => navigate("/simulation")}>
              <Sparkles size={16} /> Simulate
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <LearningPath steps={p.steps} pathId={p.path_id} />
        <div className="space-y-4">
          <CoverageSummary pct={p.prerequisite_coverage_pct} />
          <Card className="bg-surface-secondary text-body-sm text-secondary">
            This path is selected deterministically from your goal, current skills, and the evidence
            base — not generated at random.
          </Card>
        </div>
      </div>
    </div>
  );
}
