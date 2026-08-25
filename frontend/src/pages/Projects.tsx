import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderGit2 } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { ResourceCard } from "../components/ResourceCard";
import { EmptyState, ErrorState, LoadingState } from "../components/ui";

export default function Projects() {
  const { learnerId } = useApp();
  const navigate = useNavigate();
  const qc = useQueryClient();
  useEffect(() => { if (!learnerId) navigate("/onboarding"); }, [learnerId, navigate]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["recommendations", learnerId],
    queryFn: () => api.recommendations(learnerId!),
    enabled: !!learnerId,
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
      title="We couldn't load your projects."
      body="Make sure the backend is running on port 8000, then try again."
      action={<button onClick={() => refetch()} className="btn-primary">Retry</button>}
    />
  );
  if (isLoading || !data) return <LoadingState label="Loading projects…" />;

  const projects = data.recommendations.filter((r) => r.resource.type === "project");

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight"><FolderGit2 size={22} className="text-accent" /> Projects</h1>
        <p className="text-secondary">Portfolio-ready work that proves your skills to employers.</p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Projects appear as you progress through your learning path. Finish the Machine Learning module to unlock your first build."
          action={<button onClick={() => navigate("/path")} className="btn-subtle">View my path</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((r, i) => (
            <ResourceCard
              key={r.resource.id}
              rec={r}
              index={i}
              started={started.has(r.resource.id)}
              onStart={(id) => start.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
