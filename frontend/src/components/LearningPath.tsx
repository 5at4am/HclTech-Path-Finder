import { motion } from "framer-motion";
import { Check, Lock, Star, CircleDot } from "lucide-react";
import type { LearningStepOut } from "../lib/types";
import { cx, StatusBadge, difficultyColor } from "./ui";

const STATUS_DOT: Record<string, string> = {
  completed: "bg-success text-bg",
  current: "bg-accent text-white",
  recommended: "bg-info text-white",
  locked: "bg-border text-muted",
  optional: "bg-warning/30 text-warning",
};

function NodeIcon({ status }: { status: string }) {
  if (status === "completed") return <Check size={15} />;
  if (status === "locked") return <Lock size={13} />;
  if (status === "optional") return <Star size={13} />;
  return <CircleDot size={14} />;
}

export default function LearningPath({
  steps,
  selectedId,
  onSelect,
}: {
  steps: LearningStepOut[];
  selectedId?: string | null;
  onSelect?: (step: LearningStepOut) => void;
}) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const selected = selectedId === step.id;
        return (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.6), duration: 0.35 }}
            className="relative pl-12"
          >
            {!isLast && (
              <span
                className={cx(
                  "absolute left-[18px] top-9 bottom-0 w-px",
                  step.status === "completed" ? "bg-success/50" : "bg-border"
                )}
                aria-hidden
              />
            )}
            <span
              className={cx(
                "absolute left-2 top-2 flex h-[32px] w-[32px] items-center justify-center rounded-full border border-border",
                STATUS_DOT[step.status] || STATUS_DOT.locked
              )}
              aria-hidden
            >
              <NodeIcon status={step.status} />
            </span>

            <button
              type="button"
              onClick={() => onSelect?.(step)}
              className={cx(
                "mb-3 w-full rounded-card border bg-surface p-4 text-left transition-colors",
                selected ? "border-accent/60 bg-accent-soft" : "border-border hover:border-accent/40 hover:bg-hover",
                step.status === "locked" && "opacity-70"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{step.resource.title}</span>
                  {step.milestone && <span className="pill text-accent">Milestone</span>}
                </div>
                <StatusBadge status={step.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span className="capitalize">{step.resource.type}</span>
                <span className={cx("capitalize font-medium", difficultyColor(step.resource.difficulty))}>{step.resource.difficulty}</span>
                <span>{step.estimated_hours} hrs</span>
                <span className="capitalize">{step.resource.format}</span>
                {step.resource.skills_gained.length > 0 && (
                  <span className="text-secondary">+{step.resource.skills_gained.slice(0, 3).join(", ")}</span>
                )}
              </div>
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}
