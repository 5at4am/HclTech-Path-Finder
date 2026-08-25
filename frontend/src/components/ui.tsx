import { type ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success/15 text-success border-success/30",
  current: "bg-accent-soft text-accent border-accent/40",
  recommended: "bg-info/10 text-info border-info/25",
  locked: "bg-surface text-muted border-border",
  optional: "bg-warning/10 text-warning border-warning/25",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={cx("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", STATUS_STYLES[status] || STATUS_STYLES.locked)}>
      {label}
    </span>
  );
}

export function SkillBar({ label, level, required, gap }: { label: string; level: number; required?: number; gap?: number }) {
  const pct = Math.max(0, Math.min(100, level));
  const reqPct = required ? Math.max(0, Math.min(100, required)) : null;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-primary">{label.replace(/_/g, " ")}</span>
        <span className="text-xs font-semibold text-secondary tabular-nums">{pct}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-border">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent to-progress transition-all" style={{ width: `${pct}%` }} />
        {reqPct !== null && (
          <div className="absolute inset-y-0 w-0.5 bg-warning/80" style={{ left: `${reqPct}%` }} title="Required level" />
        )}
      </div>
      {gap !== undefined && gap > 0 && (
        <p className="mt-1 text-[11px] text-muted">gap {gap} pts to target</p>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-secondary">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-[32px] w-[32px] animate-spin rounded-full border-2 border-border border-t-accent" />
      {label && <p className="mt-4 text-sm text-secondary">{label}</p>}
    </div>
  );
}

/* Shimmer placeholder blocks — show layout while content loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" role="status" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-7 w-[256px]" />
        <Skeleton className="h-4 w-[192px]" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[96px] rounded-card" />
        ))}
      </div>
      <Skeleton className="h-36 rounded-card" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-56 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}

export function ErrorState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-error/30 bg-error/5 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold text-error">{title}</h3>
      <p className="mt-2 text-sm text-secondary">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ScoreRing({ value, label, color = "#8B5CF6" }: { value: number; label?: string; color?: string }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div className="flex items-center gap-3">
      <svg width="42" height="42" viewBox="0 0 42 42" className="-rotate-90">
        <circle cx="21" cy="21" r={r} fill="none" stroke="#273049" strokeWidth="4" />
        <circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      {label && <span className="text-sm font-semibold text-primary">{label}</span>}
    </div>
  );
}

export function difficultyColor(d: string) {
  return d === "beginner" ? "text-success" : d === "intermediate" ? "text-warning" : "text-error";
}
