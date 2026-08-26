import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass, GitBranch, ShieldCheck } from "lucide-react";
import { useLearner } from "../store/useLearner";
import { Button } from "../components/ui";

export function Landing() {
  const { learnerId } = useLearner();
  const navigate = useNavigate();

  useEffect(() => {
    if (learnerId) navigate("/dashboard", { replace: true });
  }, [learnerId, navigate]);

  return (
    <div className="min-h-screen bg-bg text-primary relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 78% 12%, rgba(131,56,236,0.16), transparent 34%), radial-gradient(circle at 92% 78%, rgba(251,86,7,0.06), transparent 26%)",
        }}
      />
      <header className="relative container-page mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-8 w-8 place-items-center rounded-md text-white font-bold"
            style={{ background: "linear-gradient(135deg, var(--purple-600), var(--purple-400))" }}
          >
            ◆
          </div>
          <span className="text-title font-semibold">Astrolabe</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/onboarding")}>
          Get started
        </Button>
      </header>

      <main className="relative container-page mx-auto px-6 pt-16 pb-24 md:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="section-eyebrow mb-4">Personalized learning navigation</div>
          <h1 className="text-display-lg text-primary">
            Your goal. Your path. <span className="text-brand">Your pace.</span>
          </h1>
          <p className="text-body-lg text-secondary mt-5 max-w-2xl">
            Tell Astrolabe your goal. It maps what you already know, finds your skill gaps, and
            sequences courses, projects, and assessments into an ordered path — with a reason for
            every step, backed by real learner reviews.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate("/onboarding")}>
              Map my path <ArrowRight size={18} />
            </Button>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <Feature
              icon={<Compass size={20} className="text-brand" />}
              title="Goal to direction"
              body="Turn an ambition into a sequenced, navigable path."
            />
            <Feature
              icon={<GitBranch size={20} className="text-brand" />}
              title="Skill gaps exposed"
              body="See exactly where you are versus where you need to be."
            />
            <Feature
              icon={<ShieldCheck size={20} className="text-brand" />}
              title="Evidence-backed"
              body="Every recommendation cites real learner reviews."
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-panel border border-default bg-card p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="text-title text-primary">{title}</h3>
      <p className="text-body-sm text-secondary mt-1">{body}</p>
    </div>
  );
}
