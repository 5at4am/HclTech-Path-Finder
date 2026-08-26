import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, Check, Quote, Sparkles, ThumbsUp } from "lucide-react";
import type { Evidence, RecommendationOut, ResourceOut } from "../lib/types";
import { Badge, Card, ProgressBar, cx } from "./ui";

export function formatDuration(hours: number): string {
  if (hours <= 0) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function difficultyTone(d: string): "brand" | "success" | "warning" | "error" | "neutral" {
  switch (d.toLowerCase()) {
    case "beginner":
      return "success";
    case "easy":
      return "success";
    case "intermediate":
      return "brand";
    case "medium":
      return "brand";
    case "advanced":
      return "warning";
    case "hard":
      return "error";
    default:
      return "neutral";
  }
}

const TYPE_LABEL: Record<string, string> = {
  course: "Course",
  project: "Project",
  book: "Book",
  video: "Video",
  article: "Article",
  assessment: "Assessment",
  tutorial: "Tutorial",
};

export function ResourceMeta({ resource }: { resource: ResourceOut }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">{TYPE_LABEL[resource.type] ?? resource.type}</Badge>
      {resource.domain && <Badge tone="brand">{resource.domain}</Badge>}
      <Badge tone={difficultyTone(resource.difficulty)}>{resource.difficulty}</Badge>
      <span className="meta inline-flex items-center gap-1">
        <Clock size={13} /> {formatDuration(resource.duration_hours)}
      </span>
      {resource.rating > 0 && (
        <span className="meta inline-flex items-center gap-1">
          ★ {resource.rating.toFixed(1)}
        </span>
      )}
      <span className="meta inline-flex items-center gap-1 capitalize">{resource.format}</span>
    </div>
  );
}

export function ResourceCard({
  resource,
  footer,
  className,
}: {
  resource: ResourceOut;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cx("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-title text-primary leading-snug">{resource.title}</h3>
        <BookOpen size={18} className="text-muted shrink-0 mt-1" />
      </div>
      <ResourceMeta resource={resource} />
      {resource.description && (
        <p className="text-body-sm text-secondary">{resource.description}</p>
      )}
      {resource.skills_gained.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resource.skills_gained.slice(0, 6).map((s) => (
            <span key={s} className="pill">
              {s}
            </span>
          ))}
        </div>
      )}
      {footer && <div className="mt-auto pt-1">{footer}</div>}
    </Card>
  );
}

export function EvidenceCard({ evidence }: { evidence: Evidence | null }) {
  if (!evidence) return null;
  const quotes = evidence.matched_signatures ?? [];
  const similarity = typeof evidence.similarity === "number" ? Math.round(evidence.similarity * 100) : null;
  return (
    <div className="rounded-md border border-default bg-surface-secondary p-3">
      <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wide text-muted">
        <Quote size={13} /> Learner evidence
      </div>
      {quotes.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {quotes.slice(0, 4).map((q, i) => (
            <li key={i} className="font-mono text-body-sm text-secondary border-l-2 border-brand pl-3">
              “{q}”
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-muted mt-2">No direct review quotes matched this resource.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted">
        {similarity !== null && (
          <span className="inline-flex items-center gap-1">
            <Sparkles size={13} className="text-brand" /> Evidence similarity {similarity}%
          </span>
        )}
        {evidence.peer_courses?.length > 0 && (
          <span>
            From {evidence.peer_courses.length} peer {evidence.peer_courses.length === 1 ? "course" : "courses"}
          </span>
        )}
        {evidence.source && <span className="opacity-70">source: {evidence.source}</span>}
      </div>
    </div>
  );
}

function MatchRow({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption text-secondary w-32 shrink-0">{label}</span>
      <ProgressBar value={pct} className="flex-1" />
      <span className="text-caption text-muted w-9 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

export function RecommendationCard({ rec }: { rec: RecommendationOut }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-title text-primary leading-snug">{rec.resource.title}</h3>
        {rec.match_score > 0 && (
          <Badge tone="brand">{Math.round(rec.match_score * 100)}% match</Badge>
        )}
      </div>
      <ResourceMeta resource={rec.resource} />
      {rec.reason && <p className="text-body-sm text-secondary">{rec.reason}</p>}

      <div className="space-y-1.5 rounded-md bg-surface-secondary p-3">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted mb-1">
          Why this fits
        </p>
        <MatchRow label="Skill gap match" value={rec.skill_gap_match} />
        <MatchRow label="Interest match" value={rec.interest_match} />
        <MatchRow label="Prerequisite fit" value={rec.prerequisite_fit} />
        <MatchRow label="Difficulty fit" value={rec.difficulty_fit} />
        <MatchRow label="Time fit" value={rec.time_fit} />
      </div>

      <button
        className="btn btn-ghost btn-sm self-start"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Hide evidence" : "Why this is recommended"}
      </button>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <CheckReason ok={rec.skill_gap_match >= 0.5} text="Matches your skill gap" />
            <CheckReason ok={rec.difficulty_fit >= 0.5} text="Fits your difficulty level" />
            <CheckReason ok={rec.prerequisite_fit >= 0.5} text="Prerequisites are met" />
            <CheckReason ok={rec.time_fit >= 0.5} text="Fits your timeline" />
          </div>
          <EvidenceCard evidence={rec.evidence} />
        </motion.div>
      )}
    </Card>
  );
}

function CheckReason({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className={cx("flex items-center gap-2 text-body-sm", ok ? "text-secondary" : "text-muted")}>
      <span className={cx("grid h-4 w-4 place-items-center rounded-full", ok ? "border border-success text-success" : "bg-surface")}>
        {ok ? <Check size={11} /> : <ThumbsUp size={11} />}
      </span>
      {text}
    </div>
  );
}

export function SkillGapCard({
  skill,
  level,
  required,
  gap,
  domain,
}: {
  skill: string;
  level: number;
  required: number;
  gap: number;
  domain?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((level / Math.max(1, required)) * 100)));
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-title text-primary">{skill}</span>
        {domain && <Badge tone="brand">{domain}</Badge>}
      </div>
      <div className="flex items-baseline gap-2 text-caption text-muted">
        <span className="tabular-nums text-secondary font-medium">{level}</span>
        <span>/ {required} required</span>
        {gap > 0 && <span className="ml-auto text-accent font-medium">+{gap} gap</span>}
      </div>
      <ProgressBar value={pct} tone={gap === 0 ? "success" : "brand"} />
    </Card>
  );
}
