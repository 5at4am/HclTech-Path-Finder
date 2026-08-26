import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Lock,
  CircleDot,
  Circle,
  Flag,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import type { LearningStepOut } from "../lib/types";
import { Badge, ProgressBar, cx } from "./ui";
import { difficultyTone, formatDuration } from "./product.cards";

type StepStatus = LearningStepOut["status"];

export const STEP_META: Record<
  StepStatus,
  { label: string; tone: "success" | "brand" | "neutral" | "error"; icon: React.ReactNode; ring: string }
> = {
  completed: { label: "Completed", tone: "success", icon: <Check size={14} />, ring: "border-success text-success" },
  current: { label: "Current", tone: "brand", icon: <CircleDot size={14} />, ring: "border-brand text-brand shadow-brand" },
  recommended: { label: "Recommended", tone: "neutral", icon: <Circle size={14} />, ring: "border-border-strong text-secondary" },
  optional: { label: "Optional", tone: "neutral", icon: <Circle size={14} />, ring: "border-border-strong text-secondary" },
  locked: { label: "Locked", tone: "error", icon: <Lock size={14} />, ring: "border-border text-muted" },
};

export function StepStatusBadge({ status }: { status: StepStatus }) {
  const m = STEP_META[status];
  return (
    <Badge tone={m.tone}>
      <span className="inline-flex items-center gap-1">
        {m.icon}
        {m.label}
      </span>
    </Badge>
  );
}

function StepNode({ status }: { status: StepStatus }) {
  const m = STEP_META[status];
  const filled = status === "completed" || status === "current";
  return (
    <div
      className={cx(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 bg-card",
        m.ring,
        status === "completed" && "bg-success border-success text-white",
        status === "current" && "bg-brand-soft",
      )}
      aria-hidden
    >
      {filled ? m.icon : <span className="h-2 w-2 rounded-full bg-current opacity-60" />}
    </div>
  );
}

export function LearningStepRow({
  step,
  pathId,
  index,
  last,
}: {
  step: LearningStepOut;
  pathId: string;
  index: number;
  last: boolean;
}) {
  const navigate = useNavigate();
  const locked = step.status === "locked";
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <StepNode status={step.status} />
        {!last && (
          <div
            className={cx(
              "w-px flex-1 my-1",
              step.status === "completed" ? "bg-success" : "bg-border",
            )}
          />
        )}
      </div>
      <div
        className={cx(
          "flex-1 rounded-panel border bg-card p-4 mb-3 transition-colors",
          step.status === "current" ? "border-brand" : "border-default",
          locked && "opacity-70",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-caption text-muted tabular-nums">Step {index + 1}</span>
          <Badge tone="brand">{step.phase}</Badge>
          <StepStatusBadge status={step.status} />
          {step.milestone && (
            <Badge tone="accent">
              <Flag size={11} /> Milestone
            </Badge>
          )}
        </div>
        <div className="flex items-start justify-between gap-3">
          <h3 className={cx("text-title text-primary", locked && "text-muted")}>
            {step.resource.title}
          </h3>
          <button
            className="btn btn-secondary btn-sm shrink-0"
            disabled={locked}
            onClick={() => navigate(`/path/${pathId}/step/${step.id}`)}
          >
            Open <ArrowRight size={14} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-caption text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} /> {formatDuration(step.estimated_hours)}
          </span>
          <Badge tone={difficultyTone(step.resource.difficulty)}>{step.resource.difficulty}</Badge>
          {step.skills_gained.length > 0 && (
            <span className="truncate max-w-[50%]">{step.skills_gained.slice(0, 3).join(", ")}</span>
          )}
        </div>
        {step.evidence && (step.evidence.matched_signatures?.length ?? 0) > 0 && (
          <p className="mt-2 font-mono text-caption text-secondary border-l-2 border-brand pl-2 line-clamp-2">
            “{step.evidence.matched_signatures[0]}”
          </p>
        )}
      </div>
    </div>
  );
}

export function LearningPath({
  steps,
  pathId,
}: {
  steps: LearningStepOut[];
  pathId: string;
}) {
  if (steps.length === 0) {
    return <p className="text-secondary">This path has no steps yet.</p>;
  }
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <LearningStepRow key={step.id} step={step} pathId={pathId} index={i} last={i === steps.length - 1} />
      ))}
    </div>
  );
}

export function CoverageSummary({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-3 rounded-panel border border-default bg-card p-4">
      <Sparkles size={18} className="text-brand" />
      <div className="flex-1">
        <p className="text-caption text-muted">Prerequisite coverage</p>
        <p className="text-title text-primary">{pct}%</p>
      </div>
      <ProgressBar value={pct} className="w-32" />
    </div>
  );
}
