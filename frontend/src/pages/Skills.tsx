import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../lib/store";
import { SkillBar, ErrorState } from "../components/ui";

export default function Skills() {
  const { learnerId } = useApp();
  const navigate = useNavigate();
  useEffect(() => { if (!learnerId) navigate("/onboarding"); }, [learnerId, navigate]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard", learnerId, "skills"],
    queryFn: () => api.dashboard(learnerId!),
    enabled: !!learnerId,
  });

  if (!learnerId) return null;
  if (isError) return (
    <ErrorState
      title="We couldn't load your skills."
      body="Make sure the backend is running on port 8000, then try again."
      action={<button onClick={() => refetch()} className="btn-primary">Retry</button>}
    />
  );
  if (isLoading || !data) return <div className="py-20 text-center text-muted">Loading skills…</div>;

  const skills = data.skills;
  const chartData = skills.map((s) => ({ skill: s.skill.replace(/_/g, " "), level: s.level }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your skills</h1>
        <p className="text-secondary">Where you are today, and what your goal requires.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h3 className="mb-4 font-semibold">Skill profile</h3>
          <div className="space-y-4">
            {skills.map((s) => <SkillBar key={s.skill} label={s.skill} level={s.level} required={s.required} gap={s.gap} />)}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="mb-2 font-semibold">Coverage</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} outerRadius="75%">
                <PolarGrid stroke="#27272A" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#A1A1AA", fontSize: 11 }} />
                <Radar dataKey="level" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h3 className="mb-4 font-semibold text-warning">Priority gaps</h3>
        <ol className="grid gap-3 sm:grid-cols-2">
          {data.priority_gaps.map((g, i) => (
            <li key={g.skill} className="flex items-center gap-3 rounded-btn border border-border bg-surface px-4 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-warning/15 text-sm font-bold text-warning">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="text-sm font-medium capitalize text-primary">{g.skill.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted">currently {g.current_level}% — closes a gap on your path</p>
              </div>
            </li>
          ))}
        </ol>
        <button onClick={() => navigate("/path")} className="btn-subtle mt-5">See how gaps connect to your path <ArrowRight size={16} /></button>
      </section>
    </div>
  );
}
