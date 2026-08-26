import { useMemo, useState } from "react";
import { useLearner } from "../store/useLearner";
import { useRecommendations } from "../lib/hooks";
import { EmptyState, ErrorState, PageHeader, Skeleton, Tabs } from "../components/ui";
import { RecommendationCard } from "../components/product.cards";
import { Lightbulb } from "lucide-react";

export function Recommendations() {
  const { learnerId } = useLearner();
  const { data, isLoading, isError, error, refetch } = useRecommendations(learnerId);
  const [domain, setDomain] = useState<string>("all");

  const domains = useMemo(() => {
    const set = new Set<string>();
    (data?.recommendations ?? []).forEach((r) => set.add(r.resource.domain || "General"));
    return ["all", ...Array.from(set)];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (domain === "all") return data.recommendations;
    return data.recommendations.filter((r) => (r.resource.domain || "General") === domain);
  }, [data, domain]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError)
    return <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  if (!data || data.recommendations.length === 0)
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader eyebrow="Recommendations" title="Resources for you" />
        <EmptyState
          title="No recommendations yet"
          description="Build or open your learning path to see evidence-backed recommendations."
          icon={<Lightbulb size={28} />}
        />
      </div>
    );

  return (
    <div>
      <PageHeader
        eyebrow="Recommendations"
        title="What to learn next, and why"
        description="Every recommendation is scored against your gaps, interests, and timeline — with learner evidence."
      />

      {domains.length > 2 && (
        <Tabs
          tabs={domains.map((d) => ({ id: d, label: d === "all" ? "All" : d }))}
          value={domain}
          onChange={setDomain}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((r) => (
          <RecommendationCard key={r.resource.id} rec={r} />
        ))}
      </div>
    </div>
  );
}
