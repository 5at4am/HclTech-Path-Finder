import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, GitBranch } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useSimulate } from "../lib/hooks";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from "../components/ui";
import { SimulationComparison } from "../components/product.panels";

export function Simulation() {
  const { learnerId, profile } = useLearner();
  const navigate = useNavigate();
  const simulate = useSimulate();
  const [study, setStudy] = useState(profile?.study_time_per_week ?? 6);
  const [exp, setExp] = useState(profile?.experience_level ?? "beginner");
  const [interest, setInterest] = useState("");

  if (!learnerId) return null;

  const run = () => {
    const changes: Record<string, unknown> = {
      study_time_per_week: study,
      experience_level: exp,
    };
    if (interest.trim()) changes.add_interest = interest.trim();
    simulate.mutate({ learnerId, changes });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Simulation"
        title="What if?"
        description="Model how changes to your pace or experience shift your path. Based on real backend data — not a prediction."
      />

      {!simulate.data && !simulate.isError && (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="space-y-4 h-fit">
            <div>
              <label className="label">Weekly study time (hours)</label>
              <Input
                type="number"
                min={1}
                max={80}
                value={study}
                onChange={(e) => setStudy(parseInt(e.target.value || "6", 10))}
              />
            </div>
            <div>
              <label className="label">Assume experience level</label>
              <Select value={exp} onChange={(e) => setExp(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>
            <div>
              <label className="label">Add an interest (optional)</label>
              <Input
                placeholder="e.g. testing"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
              />
            </div>
            <Button className="w-full" loading={simulate.isPending} onClick={run}>
              <Sparkles size={16} /> Run simulation
            </Button>
          </Card>

          <Card className="bg-surface-secondary flex items-center justify-center text-center text-secondary">
            <div>
              <p className="text-body">Adjust the inputs and run a simulation to compare your current path with a hypothetical one.</p>
            </div>
          </Card>
        </div>
      )}

      {simulate.isError && (
        <ErrorState
          title="Couldn't run the simulation."
          description={(simulate.error as Error)?.message}
          onRetry={run}
        />
      )}

      {simulate.data && (
        <div className="space-y-6">
          <SimulationComparison sim={simulate.data} />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-heading-sm text-primary">Simulated path</h2>
              <Button variant="ghost" size="sm" onClick={() => simulate.reset()}>
                Adjust inputs
              </Button>
            </div>
            <div className="space-y-2">
              {simulate.data.steps.map((s, i) => (
                <Card key={s.id} className="flex items-center gap-3 bg-surface-secondary">
                  <span className="text-caption text-muted tabular-nums w-6">{i + 1}</span>
                  <span className="flex-1 text-body-sm text-secondary truncate">{s.resource.title}</span>
                  <span className="text-caption text-muted capitalize">{s.phase}</span>
                  <span
                    className="text-caption font-medium"
                    style={{
                      color:
                        s.status === "completed"
                          ? "var(--color-success)"
                          : s.status === "current"
                            ? "var(--color-brand)"
                            : s.status === "locked"
                              ? "var(--color-text-muted)"
                              : "var(--color-text-secondary)",
                    }}
                  >
                    {s.status}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
