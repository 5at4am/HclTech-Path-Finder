import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { ResourceCard } from "../components/ResourceCard";
import { EmptyState, ErrorState, LoadingState } from "../components/ui";

type Tab = "recommended" | "courses" | "projects" | "saved";
type Sort = "match" | "evidence" | "difficulty" | "rating";

const DIFF_ORDER: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };

export default function Courses() {
  const { learnerId } = useApp();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("recommended");
  const [adaptMsg, setAdaptMsg] = useState("");

  const [domain, setDomain] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [format, setFormat] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("match");

  useEffect(() => { if (!learnerId) navigate("/onboarding"); }, [learnerId, navigate]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["recommendations", learnerId],
    queryFn: () => api.recommendations(learnerId!),
    enabled: !!learnerId,
  });

  const feedback = useMutation({
    mutationFn: (vars: { resourceId: string; helpful: boolean; reason: string }) =>
      api.postFeedback({ learner_id: learnerId!, resource_id: vars.resourceId, helpful: vars.helpful, reason: vars.reason }),
    onSuccess: (res) => {
      setAdaptMsg(res.adaptation);
      qc.invalidateQueries({ queryKey: ["recommendations", learnerId] });
      qc.invalidateQueries({ queryKey: ["dashboard", learnerId] });
    },
  });

  const [started, setStarted] = useState<Set<string>>(new Set());
  const start = useMutation({
    mutationFn: (resourceId: string) =>
      api.postProgress({ learner_id: learnerId!, resource_id: resourceId, status: "in_progress", completion_percentage: 5 }),
    onSuccess: (_res, resourceId) => {
      setStarted((s) => new Set(s).add(resourceId));
      qc.invalidateQueries({ queryKey: ["dashboard", learnerId] });
    },
  });

  const recs = data?.recommendations ?? [];

  const domains = useMemo(
    () => ["all", ...Array.from(new Set(recs.map((r) => r.resource.domain))).sort()],
    [recs],
  );
  const formats = useMemo(
    () => ["all", ...Array.from(new Set(recs.map((r) => r.resource.format))).sort()],
    [recs],
  );

  const tabFiltered = useMemo(() => {
    if (tab === "courses") return recs.filter((r) => r.resource.type === "course");
    if (tab === "projects") return recs.filter((r) => r.resource.type === "project");
    return recs;
  }, [recs, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabFiltered.filter((r) => {
      if (domain !== "all" && r.resource.domain !== domain) return false;
      if (difficulty !== "all" && r.resource.difficulty !== difficulty) return false;
      if (format !== "all" && r.resource.format !== format) return false;
      if (q && !`${r.resource.title} ${r.resource.description} ${r.resource.skills_gained.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tabFiltered, domain, difficulty, format, query]);

  // "Top priority" = the 3 best-matching resources in the current view.
  const priorityIds = useMemo(() => {
    const top = [...filtered].sort((a, b) => b.match_score - a.match_score).slice(0, 3);
    return new Set(top.map((r) => r.resource.id));
  }, [filtered]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sort) {
        case "evidence": return b.evidence_score - a.evidence_score;
        case "difficulty": return (DIFF_ORDER[a.resource.difficulty] ?? 2) - (DIFF_ORDER[b.resource.difficulty] ?? 2);
        case "rating": return b.resource.rating - a.resource.rating;
        default: return b.match_score - a.match_score;
      }
    });
    return arr;
  }, [filtered, sort]);

  if (!learnerId) return null;
  if (isError) return (
    <ErrorState
      title="We couldn't load your recommendations."
      body="Make sure the backend is running on port 8000, then try again."
      action={<button onClick={() => refetch()} className="btn-primary">Retry</button>}
    />
  );
  if (isLoading || !data) return <LoadingState label="Loading recommendations…" />;

  const tabs: Tab[] = ["recommended", "courses", "projects", "saved"];
  const showFilters = tab !== "saved";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Courses & resources</h1>
        <p className="text-secondary">Recommended from your profile and goal.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative rounded-btn px-4 py-2 text-sm font-medium capitalize transition-colors ${tab === t ? "text-primary" : "text-secondary hover:text-primary"}`}
          >
            {tab === t && (
              <motion.span
                layoutId="course-tab-pill"
                className="absolute inset-0 rounded-btn border border-accent-soft bg-accent-soft"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      {adaptMsg && (
        <div className="rounded-btn border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-primary">
          {adaptMsg}
        </div>
      )}

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-btn border border-border-subtle bg-surface-muted/30 p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, skills…"
            className="input h-9 min-w-[180px] flex-1"
          />
          <FilterSelect label="Domain" value={domain} onChange={setDomain} options={domains} />
          <FilterSelect label="Difficulty" value={difficulty} onChange={setDifficulty} options={["all", "beginner", "intermediate", "advanced"]} />
          <FilterSelect label="Format" value={format} onChange={setFormat} options={formats} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-btn border border-border bg-surface px-2 text-sm text-primary"
          >
            <option value="match">Sort: Best match</option>
            <option value="evidence">Sort: Evidence fit</option>
            <option value="difficulty">Sort: Difficulty</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>
      )}

      {tab === "saved" ? (
        <EmptyState
          title="No saved resources yet"
          body="Save courses and projects here to revisit them later."
          action={<button onClick={() => setTab("recommended")} className="btn-subtle">Browse recommendations</button>}
        />
      ) : sorted.length === 0 ? (
        <EmptyState title="No matches" body="Try clearing a filter or switching tabs." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((r, i) => (
            <ResourceCard
              key={r.resource.id}
              rec={r}
              index={i}
              priority={priorityIds.has(r.resource.id)}
              started={started.has(r.resource.id)}
              onFeedback={(id, h, reason) => feedback.mutate({ resourceId: id, helpful: h, reason })}
              onStart={(id) => start.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-1 text-sm text-secondary">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-btn border border-border bg-surface px-2 text-sm text-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o === "all" ? `All ${label.toLowerCase()}s` : o}</option>
        ))}
      </select>
    </label>
  );
}
