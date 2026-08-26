import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock, Sparkles, BookOpen } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { usePath, useUpdateProgress, useExplainStep } from "../lib/hooks";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
  cx,
} from "../components/ui";
import { ResourceMeta, EvidenceCard, difficultyTone } from "../components/product.cards";
import { StepStatusBadge } from "../components/product.paths";
import { FeedbackControl, MentorMessage, MentorContextCard } from "../components/product.panels";
import { useMentorHistory } from "../lib/hooks";

export function StepDetail() {
  const { pathId = "", stepId = "" } = useParams();
  const { learnerId, profile } = useLearner();
  const navigate = useNavigate();
  const path = usePath(pathId);
  const updateProgress = useUpdateProgress();
  const explain = useExplainStep();
  const history = useMentorHistory(learnerId);

  const step = path.data?.steps.find((s) => s.id === stepId);

  if (path.isLoading) return <Skeleton className="h-96" />;
  if (path.isError)
    return <ErrorState description={(path.error as Error)?.message} onRetry={() => path.refetch()} />;
  if (!step) return <ErrorState title="Step not found." />;

  const setProgress = (value: number, status?: string) => {
    if (!learnerId) return;
    updateProgress.mutate({
      learnerId,
      resourceId: step.resource_id,
      completionPercentage: value,
      status: status ?? (value >= 100 ? "completed" : value > 0 ? "current" : undefined),
    });
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(`/path`)}>
        <ArrowLeft size={16} /> Back to path
      </button>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            Step {step.order + 1} · {step.phase}
          </span>
        }
        title={step.resource.title}
        description={<ResourceMeta resource={step.resource} />}
        actions={<StepStatusBadge status={step.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Why this step */}
          <Card>
            <h2 className="text-title text-primary mb-2">Why this step?</h2>
            <p className="text-body text-secondary">{step.reason || "Part of your sequenced path."}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-caption text-muted">
              <span className="inline-flex items-center gap-1">
                <Clock size={14} /> {step.estimated_hours}h
              </span>
              <Badge tone={difficultyTone(step.resource.difficulty)}>{step.resource.difficulty}</Badge>
              {step.milestone && <Badge tone="accent">Milestone</Badge>}
            </div>
          </Card>

          {/* What you'll learn + prereqs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="text-title text-primary mb-2">What you'll learn</h3>
              {step.skills_gained.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {step.skills_gained.map((s) => (
                    <span key={s} className="pill">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted">No specific skills listed.</p>
              )}
            </Card>
            <Card>
              <h3 className="text-title text-primary mb-2">Prerequisites</h3>
              {step.prerequisites.length ? (
                <ul className="space-y-1 text-body-sm text-secondary">
                  {step.prerequisites.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <BookOpen size={13} className="text-muted" /> {p}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-muted">None — start anytime.</p>
              )}
            </Card>
          </div>

          {/* Evidence */}
          <Card>
            <h3 className="text-title text-primary mb-3">Evidence</h3>
            <EvidenceCard evidence={step.evidence} />
          </Card>

          {/* Progress control */}
          <Card>
            <h3 className="text-title text-primary mb-3">Your progress</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={step.completion_percentage === 0 ? "primary" : "secondary"}
                onClick={() => setProgress(0)}
                disabled={updateProgress.isPending}
              >
                Not started
              </Button>
              <Button
                size="sm"
                variant={step.completion_percentage > 0 && step.completion_percentage < 100 ? "primary" : "secondary"}
                onClick={() => setProgress(50)}
                disabled={updateProgress.isPending}
              >
                In progress
              </Button>
              <Button
                size="sm"
                variant={step.completion_percentage >= 100 ? "primary" : "secondary"}
                onClick={() => setProgress(100, "completed")}
                disabled={updateProgress.isPending}
              >
                <Check size={14} /> Mark complete
              </Button>
              <span className="text-caption text-muted tabular-nums ml-1">
                {step.completion_percentage}%
              </span>
            </div>
          </Card>

          {/* Feedback */}
          {learnerId && (
            <Card>
              <FeedbackControl learnerId={learnerId} resourceId={step.resource_id} />
            </Card>
          )}

          {/* Mentor explain */}
          <Card>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-title text-primary">Ask the mentor</h3>
              <Button
                size="sm"
                variant="secondary"
                disabled={explain.isPending}
                onClick={() => explain.mutate({ pathId, stepId })}
              >
                <Sparkles size={14} /> Explain this step
              </Button>
            </div>
            {explain.data && (
              <MentorMessage
                message={explain.data.message}
                sources={explain.data.sources}
                evidence={explain.data.evidence}
              />
            )}
          </Card>
        </div>

        {/* Context sidebar */}
        <aside className="space-y-4">
          <MentorContextCard
            goal={profile?.goal || path.data?.goal}
            stepTitle={step.resource.title}
            progressPct={path.data ? Math.round((path.data.steps.filter((s) => s.status === "completed").length / Math.max(1, path.data.steps.length)) * 100) : undefined}
          />
          {history.data && history.data.length > 0 && (
            <Card className="bg-surface-secondary">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted mb-2">
                Recent mentor chat
              </p>
              <p className="text-body-sm text-secondary line-clamp-4">
                {history.data[history.data.length - 1].message}
              </p>
              <button className="btn btn-ghost btn-sm mt-2" onClick={() => navigate("/mentor")}>
                Open mentor
              </button>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
