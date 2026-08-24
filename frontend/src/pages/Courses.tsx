import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { ResourceCard } from "../components/ResourceCard";
import { EmptyState, ErrorState } from "../components/ui";

type Tab = "recommended" | "courses" | "projects" | "saved";

export default function Courses() {
  const { learnerId } = useApp();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("recommended");
  const [adaptMsg, setAdaptMsg] = useState("");

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

  if (!learnerId) return null;
  if (isError) return (
    <ErrorState
      title="We couldn't load your recommendations."
      body="Make sure the backend is running on port 8000, then try again."
      action={<button onClick={() => refetch()} className="btn-primary">Retry</button>}
    />
  );
  if (isLoading || !data) return <div className="py-20 text-center text-muted"><Loader2 className="mx-auto animate-spin text-accent" /></div>;

  const recs = data.recommendations;
  const filtered = tab === "recommended" ? recs
    : tab === "courses" ? recs.filter((r) => r.resource.type === "course")
    : tab === "projects" ? recs.filter((r) => r.resource.type === "project")
    : [];

  const tabs: Tab[] = ["recommended", "courses", "projects", "saved"];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Courses & resources</h1>
        <p className="text-secondary">Recommended from your profile and goal.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? "btn-primary" : "btn-subtle"} capitalize`}>
            {t}
          </button>
        ))}
      </div>

      {adaptMsg && (
        <div className="rounded-btn border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-primary">
          {adaptMsg}
        </div>
      )}

      {tab === "saved" ? (
        <EmptyState
          title="No saved resources yet"
          body="Save courses and projects here to revisit them later."
          action={<button onClick={() => setTab("recommended")} className="btn-subtle">Browse recommendations</button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Try a different tab or regenerate your path." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((r) => (
            <ResourceCard
              key={r.resource.id}
              rec={r}
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
