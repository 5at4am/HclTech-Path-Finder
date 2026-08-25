import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import type { Evidence } from "../lib/types";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* SpotlightCard — Aceternity/Magic-UI-style cursor spotlight (zero-dep).
   A radial glow tracks the pointer via CSS custom properties. */
export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div ref={ref} onMouseMove={onMove} className={`spotlight-card ${className}`}>
      {children}
    </div>
  );
}

/* Number ticker — digits count up to `value` on mount/change (animation-vocabulary:
   "number ticker"). Render with tabular-nums to keep width stable. */
export function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: [0.21, 0.65, 0.36, 1] });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span>{rounded}</motion.span>;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success/15 text-success border-success/30",
  current: "bg-accent-soft text-accent border-accent-soft",
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

/* EvidencePanel — the product's signature element. A teal left rule (not a full
   border) plus a monospace quote marks "retrieved from data", distinct from
   narrated prose. The quote is built from real review signatures; the citation
   below is a single small-caps line. Deliberately quiet: no icons, badges, or
   extra chrome. Reused identically in the mentor, path detail, and recommendations. */
export function EvidencePanel({ evidence, className = "" }: { evidence: Evidence | null; className?: string }) {
  if (!evidence) return null;
  const { course_signatures, similarity, peer_courses, source } = evidence;
  if (!course_signatures.length && !peer_courses.length) return null;
  const citation = [
    peer_courses.length ? `matched in ${peer_courses.length} learner review${peer_courses.length === 1 ? "" : "s"}` : "from learner reviews",
    similarity > 0 ? `${Math.round(similarity * 100)}% similarity` : null,
    source ? source : null,
  ].filter(Boolean).join(" · ");
  return (
    <figure className={cx("border-l-2 border-accent pl-4", className)}>
      <blockquote className="space-y-1.5 font-mono text-sm leading-relaxed text-primary">
        {course_signatures.slice(0, 3).map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </blockquote>
      <figcaption className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{citation}</figcaption>
    </figure>
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
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-progress"
          style={{ width: `${pct}%`, transformOrigin: "left" }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, ease: [0.21, 0.65, 0.36, 1] }}
        />
        {reqPct !== null && (
          <div className="absolute inset-y-0 w-0.5 bg-signal" style={{ left: `${reqPct}%` }} title="Required level" />
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

export function ScoreRing({ value, label, color = "var(--color-brand)" }: { value: number; label?: string; color?: string }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div className="flex items-center gap-3">
      <svg width="42" height="42" viewBox="0 0 42 42" className="-rotate-90">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4" />
        <circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      {label && <span className="text-sm font-semibold text-primary">{label}</span>}
    </div>
  );
}

export function difficultyColor(d: string) {
  return d === "beginner" ? "text-success" : d === "intermediate" ? "text-warning" : "text-error";
}
