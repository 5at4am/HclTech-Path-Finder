import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, SlidersHorizontal, Sparkles, X, Check, AlertTriangle, ArrowRight, Clock, RefreshCw } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useDashboard, usePath, useGeneratePath, useAdaptPath } from "../lib/hooks";
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
  const adapt = useAdaptPath();
  const [showAdaptDialog, setShowAdaptDialog] = useState(false);
  const [adaptDone, setAdaptDone] = useState(false);

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
          description="PadhAI sequences your resources into a navigable path ordered by prerequisites and your goals."
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
  const adaptData = adapt.data as unknown as {
    added_titles?: string[];
    removed_titles?: string[];
    kept_count?: number;
    changes_summary?: string[];
    previous_path_id?: string | null;
  } | undefined;

  const handleAdapt = () => {
    adapt.mutate(p.path_id, {
      onSuccess: () => {
        setShowAdaptDialog(false);
        setAdaptDone(true);
        // auto-hide success after 12s
        setTimeout(() => setAdaptDone(false), 12000);
      },
    });
  };

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
              loading={adapt.isPending}
              disabled={adapt.isPending}
              onClick={() => setShowAdaptDialog(true)}
              title="Re-rank your path from latest progress & feedback — progress preserved"
            >
              <SlidersHorizontal size={16} /> Adapt
            </Button>
            <Button onClick={() => navigate("/simulation")}>
              <Sparkles size={16} /> Simulate
            </Button>
          </>
        }
      />

      {/* Success banner after adapt */}
      {adaptDone && adaptData && (
        <div className="mb-6 rounded-xl border p-4 flex gap-3 bg-surface" style={{ borderColor: "rgba(61,220,132,.22)", background: "rgba(61,220,132,.06)" }}>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-success text-white shrink-0">
            <Check size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">Path adapted — your progress was kept.</p>
            <ul className="mt-1 space-y-1 text-body-sm text-secondary">
              {(adaptData.changes_summary ?? []).map((c, i) => (
                <li key={i} className="flex gap-2">
                  <ArrowRight size={12} className="text-success mt-1 shrink-0" /> <span>{c}</span>
                </li>
              ))}
              {adaptData.added_titles && adaptData.added_titles.length > 0 && (
                <li className="text-caption text-muted">+ Added: {adaptData.added_titles.join(" · ")}</li>
              )}
              {adaptData.removed_titles && adaptData.removed_titles.length > 0 && (
                <li className="text-caption text-muted">− Removed: {adaptData.removed_titles.join(" · ")}</li>
              )}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setAdaptDone(false)}>
                Dismiss
              </Button>
              {adaptData.previous_path_id && (
                <Button size="sm" variant="secondary" onClick={() => navigate(`/path/${adaptData.previous_path_id}`)}>
                  View previous path
                </Button>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-icon shrink-0" onClick={() => setAdaptDone(false)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {adapt.isError && (
        <div className="alert alert-error mb-4 text-sm flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{(adapt.error as Error)?.message || "Could not adapt path."}</span>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <LearningPath steps={p.steps} pathId={p.path_id} />
        <div className="space-y-4">
          <CoverageSummary pct={p.prerequisite_coverage_pct} />
          <Card className="bg-surface-secondary text-body-sm text-secondary">
            <p className="font-medium text-primary flex items-center gap-2"><SlidersHorizontal size={14} className="text-brand" /> When to Adapt?</p>
            <ul className="mt-2 space-y-1.5 text-caption leading-relaxed text-muted">
              <li>• You gave feedback (too easy/difficult) or marked steps complete.</li>
              <li>• Timeline or study time changed — Adapt re-estimates months.</li>
              <li>• Progress is preserved; only the remaining steps are re-ranked.</li>
            </ul>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowAdaptDialog(true)}>
              Learn more <ArrowRight size={12} />
            </Button>
          </Card>
        </div>
      </div>

      {/* Adapt dialog */}
      {showAdaptDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !adapt.isPending && setShowAdaptDialog(false)} />
          <div className="relative w-full max-w-[560px] rounded-xl border bg-surface p-6 shadow-lg" style={{ borderColor: "var(--color-border)" }}>
            <button
              className="absolute right-3 top-3 btn btn-ghost btn-icon"
              onClick={() => setShowAdaptDialog(false)}
              disabled={adapt.isPending}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand shrink-0">
                <RefreshCw size={18} />
              </div>
              <div>
                <h3 className="text-title text-primary">Adapt your path?</h3>
                <p className="text-body-sm text-muted mt-1 leading-relaxed">
                  We keep your <span className="text-secondary font-medium">{p.steps.filter(s=>s.status==="completed").length} completed</span> + in-progress steps untouched and re-rank the rest from your latest feedback, skills and evidence. Prerequisites stay ordered. You can view the previous path afterwards.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border p-4 bg-surface-tertiary" style={{ borderColor: "var(--color-border)" }}>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-caption text-muted">Current</div>
                  <div className="font-mono text-sm font-semibold">{p.steps.length} steps</div>
                  <div className="text-caption text-muted">{p.timeline_months} mo · {p.study_time_per_week}h/w</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight size={16} className="text-brand" />
                </div>
                <div>
                  <div className="text-caption text-muted">After adapt</div>
                  <div className="font-mono text-sm font-semibold text-brand">Re-ranked</div>
                  <div className="text-caption text-muted">Progress kept</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-caption text-muted">
                <Clock size={12} /> Timeline re-estimated from your <span className="font-mono">{p.study_time_per_week}h/w</span> pace
              </div>
            </div>

            <div className="mt-4 rounded-md border px-3 py-2 flex gap-2 bg-brand-muted" style={{ borderColor: "rgba(131,56,236,.15)" }}>
              <Sparkles size={14} className="text-brand mt-0.5 shrink-0" />
              <p className="text-caption text-secondary leading-relaxed">
                Uses: gap boost + feedback penalization (too_difficult / already_know) + skill growth. No progress lost. Creates a new path version — old one stays reachable.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowAdaptDialog(false)} disabled={adapt.isPending}>
                Cancel
              </Button>
              <Button loading={adapt.isPending} disabled={adapt.isPending} onClick={handleAdapt}>
                {adapt.isPending ? "Adapting…" : "Adapt my path"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
