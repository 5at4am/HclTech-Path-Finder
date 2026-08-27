import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, Check, AlertTriangle, MessageSquareQuote } from "lucide-react";
import type { Evidence, SimulateResponse } from "../lib/types";
import { useFeedback } from "../lib/hooks";
import { Badge, Card, cx } from "./ui";
import { EvidenceCard } from "./product.cards";

/* ----------------------------- Progress overview -------------------------- */
export function ProgressOverview({
  pct,
  completed,
  total,
  currentStepTitle,
  skillsCovered,
}: {
  pct: number;
  completed: number;
  total: number;
  currentStepTitle?: string | null;
  skillsCovered?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="flex flex-col gap-1">
        <span className="text-caption text-muted">Overall progress</span>
        <span className="text-heading-sm text-primary tabular-nums">{pct}%</span>
        <div className="mt-1 h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
          <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </Card>
      <Card className="flex flex-col gap-1">
        <span className="text-caption text-muted">Steps completed</span>
        <span className="text-heading-sm text-primary tabular-nums">
          {completed}
          <span className="text-muted text-body"> / {total}</span>
        </span>
      </Card>
      <Card className="flex flex-col gap-1">
        <span className="text-caption text-muted">Now working on</span>
        <span className="text-body text-primary line-clamp-2">{currentStepTitle ?? "—"}</span>
      </Card>
      <Card className="flex flex-col gap-1">
        <span className="text-caption text-muted">Skill coverage</span>
        <span className="text-heading-sm text-primary">{skillsCovered ?? "—"}</span>
      </Card>
    </div>
  );
}

/* --------------------------- Simulation comparison ------------------------ */
export function SimulationComparison({ sim }: { sim: SimulateResponse }) {
  const current = sim.current as Record<string, number>;
  const simulated = sim.simulated as Record<string, number>;
  const rows: { label: string; key: string }[] = [
    { label: "Timeline (months)", key: "timeline_months" },
    { label: "Weekly study (hrs)", key: "study_time_per_week" },
    { label: "Total hours", key: "estimated_hours" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {rows.map((r) => {
          const c = current[r.key] ?? 0;
          const s = simulated[r.key] ?? 0;
          const diff = s - c;
          return (
            <Card key={r.key} className="flex flex-col gap-1">
              <span className="text-caption text-muted">{r.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-heading-sm text-primary tabular-nums">{s}</span>
                <span className={cx("text-caption tabular-nums", diff < 0 ? "text-success" : diff > 0 ? "text-accent" : "text-muted")}>
                  {diff === 0 ? "no change" : `${diff > 0 ? "+" : ""}${diff}`}
                </span>
              </div>
              <span className="text-caption text-muted">was {c}</span>
            </Card>
          );
        })}
      </div>

      {sim.changes_summary.length > 0 && (
        <Card className="bg-surface-secondary">
          <p className="text-caption font-semibold uppercase tracking-wide text-muted mb-2">What changed?</p>
          <ul className="space-y-1.5">
            {sim.changes_summary.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-body-sm text-secondary">
                <ArrowRight size={14} className="text-brand mt-1 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------- Feedback ---------------------------------- */
const FEEDBACK_OPTIONS = [
  { label: "Too difficult", helpful: false, reason: "Too difficult" },
  { label: "Too easy", helpful: true, reason: "Too easy" },
  { label: "Already know this", helpful: false, reason: "Already know this" },
  { label: "Not relevant", helpful: false, reason: "Not relevant" },
  { label: "Need more practice", helpful: true, reason: "Need more practice" },
];

export function FeedbackControl({
  learnerId,
  resourceId,
  onAdapted,
}: {
  learnerId: string;
  resourceId: string;
  onAdapted?: (adaptation: string) => void;
}) {
  const [done, setDone] = React.useState<string | null>(null);
  const [adaptation, setAdaptation] = React.useState<string | null>(null);
  const { mutate, isPending } = useFeedback();

  return (
    <div className="space-y-3">
      <p className="text-caption font-semibold uppercase tracking-wide text-muted">
        How is this step?
      </p>
      <div className="flex flex-wrap gap-2">
        {FEEDBACK_OPTIONS.map((o) => (
          <button
            key={o.label}
            disabled={isPending}
            className={cx("btn btn-sm", done === o.label ? "btn-primary" : "btn-secondary")}
            onClick={() => {
              setDone(o.label);
              mutate(
                { learnerId, resourceId, helpful: o.helpful, reason: o.reason },
                {
                  onSuccess: (res) => {
                    setAdaptation(res.adaptation);
                    onAdapted?.(res.adaptation);
                  },
                },
              );
            }}
          >
            {done === o.label && <Check size={14} />}
            {o.label}
          </button>
        ))}
      </div>
      {adaptation && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="alert alert-success">
          <RefreshCw size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-primary">Path updated</p>
            <p className="text-body-sm text-secondary">{adaptation}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Local hook wrapper to avoid a circular import with hooks.ts.


/* ------------------------------- Mentor ----------------------------------- */
function BulletList({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const bullets = lines.filter((l) => l.startsWith("•") || l.startsWith("-") || l.startsWith("*"));
  if (bullets.length >= 2) {
    return (
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-body-sm leading-snug">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
            <span>{b.replace(/^[•\-\*]\s*/, "")}</span>
          </li>
        ))}
        {lines.filter((l) => !bullets.includes(l)).length > 0 && (
          <li className="text-body-sm text-secondary mt-1">{lines.filter((l) => !bullets.includes(l)).join(" ")}</li>
        )}
      </ul>
    );
  }
  // fallback: short paragraph but clamped
  return <p className="text-body-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
}

export function MentorMessage({
  message,
  sources,
  evidence,
  variant = "assistant",
}: {
  message: string;
  sources?: Record<string, unknown>[];
  evidence?: Evidence | null;
  variant?: "user" | "assistant";
}) {
  const isUser = variant === "user";
  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-tertiary text-secondary text-caption font-medium">
          You
        </div>
        <div className="max-w-[78%] rounded-panel border border-default bg-surface-secondary px-4 py-3 text-body-sm">
          {message}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white" aria-hidden>
        <MessageSquareQuote size={14} />
      </div>
      <div className="max-w-[82%] space-y-2">
        <div className="rounded-panel border border-brand-soft bg-brand-muted px-4 py-3">
          <BulletList text={message} />
        </div>
        {evidence && <EvidenceCard evidence={evidence} />}
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sources.slice(0, 4).map((s, i) => {
              const label = String(s.label ?? s.title ?? s.type ?? "source");
              const isCatalog = s.type === "catalog_match";
              return (
                <span key={i} className={cx("pill text-caption", isCatalog && "border-brand-soft text-brand")}>
                  {label}
                  {isCatalog && (s as { score?: number }).score ? ` ${(s as {score:number}).score}` : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function MentorTyping() {
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white">
        <MessageSquareQuote size={14} />
      </div>
      <div className="rounded-panel border border-brand-soft bg-brand-muted px-4 py-3 flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:240ms]" />
        <span className="text-caption text-muted ml-1">soch raha hai…</span>
      </div>
    </div>
  );
}

export function MentorContextCard({
  goal,
  stepTitle,
  skillGap,
  progressPct,
}: {
  goal?: string | null;
  stepTitle?: string | null;
  skillGap?: string | null;
  progressPct?: number;
}) {
  return (
    <Card className="bg-surface-secondary">
      <p className="text-caption font-semibold uppercase tracking-wide text-muted mb-2">
        Your context
      </p>
      <dl className="space-y-1.5 text-body-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Goal</dt>
          <dd className="text-secondary text-right">{goal || "—"}</dd>
        </div>
        {stepTitle && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Current step</dt>
            <dd className="text-secondary text-right">{stepTitle}</dd>
          </div>
        )}
        {skillGap && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Focus</dt>
            <dd className="text-secondary text-right">{skillGap}</dd>
          </div>
        )}
        {typeof progressPct === "number" && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Progress</dt>
            <dd className="text-secondary text-right">{progressPct}%</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
