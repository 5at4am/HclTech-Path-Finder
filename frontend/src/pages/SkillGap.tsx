import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, ArrowRight } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useDashboard } from "../lib/hooks";
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionHeader,
  Skeleton,
  cx,
} from "../components/ui";
import { SkillGapCard } from "../components/product.cards";

export function SkillGap() {
  const { learnerId } = useLearner();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useDashboard(learnerId);

  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, typeof data.skills>();
    for (const s of data.skills) {
      const key = s.domain || "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [data]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError)
    return <ErrorState description={error instanceof Error ? error.message : undefined} onRetry={() => refetch()} />;
  if (!data || data.skills.length === 0)
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader eyebrow="Skill gap" title="Your skill map" />
        <EmptyState
          title="No skill gaps to show yet"
          description="Set a goal and Astrolabe will map your required skills against what you know."
          icon={<Layers size={28} />}
        />
      </div>
    );

  return (
    <div>
      <PageHeader
        eyebrow="Personalization"
        title="Your skill gaps"
        description="Where you are versus where your goal requires you to be — grouped by domain."
        actions={
          <Button variant="secondary" onClick={() => navigate("/recommendations")}>
            Close the gaps <ArrowRight size={16} />
          </Button>
        }
      />

      <div className="space-y-8">
        {grouped.map(([domain, skills]) => (
          <section key={domain}>
            <SectionHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand" /> {domain}
                </span>
              }
              description={`${skills.length} skill${skills.length === 1 ? "" : "s"}`}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((s) => (
                <SkillGapCard
                  key={s.skill}
                  skill={s.skill}
                  level={s.level}
                  required={s.required}
                  gap={s.gap}
                  domain={s.domain}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
