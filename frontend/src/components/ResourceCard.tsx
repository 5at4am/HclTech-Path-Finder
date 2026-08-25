import { motion } from "framer-motion";
import { Clock, Signal, BookOpen, FolderGit2, ThumbsUp, ThumbsDown, Check, Star } from "lucide-react";
import type { RecommendationOut } from "../lib/types";
import { cx, difficultyColor, StatusBadge, EvidencePanel } from "./ui";

export function ResourceCard({
  rec, onFeedback, onStart, started, index = 0, priority = false,
}: {
  rec: RecommendationOut;
  onFeedback?: (resourceId: string, helpful: boolean, reason: string) => void;
  onStart?: (resourceId: string) => void;
  started?: boolean;
  index?: number;
  priority?: boolean;
}) {
  const r = rec.resource;
  const TypeIcon = r.type === "project" ? FolderGit2 : r.type === "assessment" ? Check : BookOpen;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      className="card flex flex-col p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted">
          <TypeIcon size={15} />
          <span className="text-xs uppercase tracking-wide">{r.type}</span>
        </div>
        <StatusBadge status={r.optional ? "optional" : "recommended"} />
      </div>
      <div className="mt-2 flex items-start gap-2">
        <h3 className="text-lg font-semibold text-primary">{r.title}</h3>
        {priority && (
          <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-btn bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            <Star size={11} /> Top priority
          </span>
        )}
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-secondary">{r.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className={cx("capitalize font-medium", difficultyColor(r.difficulty))}>{r.difficulty}</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {r.duration_hours} hrs</span>
        <span className="capitalize">{r.format}</span>
        <span className="capitalize">{r.domain}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {r.skills_gained.slice(0, 4).map((s) => <span key={s} className="pill">{s.replace(/_/g, " ")}</span>)}
      </div>

      <div className="mt-3 rounded-btn border border-border-subtle bg-surface-muted/40 px-3 py-2 text-xs leading-relaxed text-secondary">
        <span className="font-medium text-primary">Why:</span> {rec.reason}
      </div>

      {rec.evidence && (
        <div className="mt-3">
          <EvidencePanel evidence={rec.evidence} />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
        <div className="flex items-center gap-2">
          <button title="Helpful" onClick={() => onFeedback?.(r.id, true, "")} className="grid h-[32px] w-[32px] place-items-center rounded-btn border border-border text-secondary transition active:scale-95 hover:text-success hover:border-success/40">
            <ThumbsUp size={14} />
          </button>
          <button title="Not useful" onClick={() => onFeedback?.(r.id, false, "not_relevant")} className="grid h-[32px] w-[32px] place-items-center rounded-btn border border-border text-secondary transition active:scale-95 hover:text-warning hover:border-warning/40">
            <ThumbsDown size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted">Match <span className="font-semibold text-primary">{Math.round(rec.match_score * 100)}%</span></span>
          <button onClick={() => onStart?.(r.id)} disabled={started} className="btn-primary !py-1.5 !px-3 text-xs">
            {started ? "Started" : "Start"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
