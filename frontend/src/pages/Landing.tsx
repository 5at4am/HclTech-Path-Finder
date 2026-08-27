import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  GitBranch,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  SlidersHorizontal,
  Check,
  Clock,
  BadgeCheck,
  Sun,
  Moon,
} from "lucide-react";
import { useLearner } from "../store/useLearner";
import { useAuth } from "../store/useAuth";
import { Button, Badge, Card } from "../components/ui";

// Applying Linear's system: violet #8338EC maps to Linear #5e6ad2, hairline rgba(255,255,255,.09) maps to #23252a, display -1.8px tracking, 8px buttons/12px cards, surface ladder canvas→surface.

const TRACKS = {
  "Frontend": {
    badge: "6 months · 6h/week",
    stats: { coverage: "38%", steps: "16 steps" },
    nodes: [
      { k: "Current skills", items: ["HTML ✓", "CSS ✓"], tone: "success" as const },
      { k: "Foundations", items: ["JavaScript", "Responsive Design"], tone: "brand" as const },
      { k: "Core", items: ["React", "State Management"], tone: "accent" as const },
      { k: "Advanced", items: ["Next.js", "Performance"], tone: "muted" as const },
      { k: "Goal", items: ["Frontend Engineer"], tone: "brand" as const },
    ],
  },
  "Backend": {
    badge: "7 months · 8h/week",
    stats: { coverage: "45%", steps: "18 steps" },
    nodes: [
      { k: "Current skills", items: ["Python ✓", "SQL ✓"], tone: "success" as const },
      { k: "Foundations", items: ["APIs", "Databases"], tone: "brand" as const },
      { k: "Core", items: ["Node.js / Express", "Auth"], tone: "accent" as const },
      { k: "Advanced", items: ["Scaling", "DevOps"], tone: "muted" as const },
      { k: "Goal", items: ["Backend Engineer"], tone: "brand" as const },
    ],
  },
  "Data Science": {
    badge: "8 months · 6h/week",
    stats: { coverage: "42%", steps: "18 steps" },
    nodes: [
      { k: "Current skills", items: ["Python ✓", "SQL ✓"], tone: "success" as const },
      { k: "Foundations", items: ["Statistics", "Probability"], tone: "brand" as const },
      { k: "Core", items: ["Data Analysis", "Visualization"], tone: "accent" as const },
      { k: "Advanced", items: ["ML Basics"], tone: "muted" as const },
      { k: "Goal", items: ["Data Scientist"], tone: "brand" as const },
    ],
  },
  "AI/ML": {
    badge: "8 months · 6h/week",
    stats: { coverage: "42%", steps: "18 steps" },
    nodes: [
      { k: "Current skills", items: ["Python ✓", "SQL ✓"], tone: "success" as const },
      { k: "Foundations", items: ["Statistics", "Probability"], tone: "brand" as const },
      { k: "Core", items: ["Machine Learning"], tone: "accent" as const },
      { k: "Advanced", items: ["Deep Learning"], tone: "muted" as const },
      { k: "Goal", items: ["AI / ML Engineer"], tone: "brand" as const },
    ],
  },
} as const;
type Track = keyof typeof TRACKS;

export function Landing() {
  const { learnerId, theme, toggleTheme } = useLearner();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [track, setTrack] = useState<Track>("AI/ML");

  useEffect(() => {
    if (token && learnerId) navigate("/dashboard", { replace: true });
  }, [token, learnerId, navigate]);

  return (
    <div className="min-h-screen bg-bg text-primary relative overflow-hidden">
      {/* Volcanic atmosphere — restrained 10% */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 72% 10%, rgba(131,56,236,0.09), transparent 38%), radial-gradient(circle at 88% 84%, rgba(251,86,7,0.04), transparent 28%)",
        }}
      />
      <div className="absolute inset-0 pointer-events-none opacity-[0.012]" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.35%27/></svg>')" }} />

      <header className="relative container-page mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md text-white font-bold text-[13px]" style={{ background: "var(--violet-500)" }} aria-hidden>
            ◆
          </div>
          <span className="text-title font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
            PadhAI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {token ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate(learnerId ? "/dashboard" : "/onboarding")}>
                {learnerId ? "Dashboard" : "Get started"}
              </Button>
              <Button size="sm" onClick={() => navigate(learnerId ? "/dashboard" : "/onboarding")}>
                {learnerId ? "Continue" : "Build path"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero — Linear display-lg 56px / -1.8px, canvas #111214 dominates, surface ladder for preview */}
      <main className="relative container-page mx-auto px-6 pt-10 pb-8 md:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-[640px]">
            <div className="section-eyebrow mb-4 inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--violet-500)" }} />
              PadhAI — Tera Learning, AI ke Saath
            </div>
            <h1
              className="text-primary"
              style={{ fontFamily: "var(--font-display)", fontSize: "56px", fontWeight: 600, lineHeight: 1.1, letterSpacing: "-1.8px" }}
            >
              Your goal.
              <br />
              Your path. <span style={{ color: "var(--violet-500)" }}>Your pace.</span>
            </h1>
            <p className="mt-5 max-w-[560px]" style={{ fontFamily: "var(--font-sans)", fontSize: "18px", lineHeight: 1.5, letterSpacing: "-0.1px", color: "var(--color-text-muted)" }}>
              PadhAI ko batao kya banna hai — we map what you already know, gaps dhoondhte hain, aur courses, projects aur
              assessments ka ordered path banate hain — har step ka reason ke saath, backed by real learner reviews.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate(token ? "/onboarding" : "/register")}>
                Build my learning path <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
                See how it works
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-caption" style={{ color: "var(--color-text-muted)" }}>
              <span className="inline-flex items-center gap-1.5">
                <Check size={13} style={{ color: "var(--green-400)" }} /> No generic templates
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={13} style={{ color: "var(--green-400)" }} /> Deterministic, explainable
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check size={13} style={{ color: "var(--green-400)" }} /> Works without LLM
              </span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="relative">
            <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <span className="text-caption font-semibold tracking-wide uppercase" style={{ color: "var(--color-text-muted)", letterSpacing: "0.4px" }}>
                  Your path preview
                </span>
                <Badge tone="brand">{TRACKS[track].badge}</Badge>
              </div>
              <div className="px-5 pt-3 pb-1 flex flex-wrap gap-1.5">
                {(Object.keys(TRACKS) as Track[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrack(t)}
                    className="pill text-xs"
                    style={
                      track === t
                        ? { background: "var(--violet-500)", color: "#fff", borderColor: "var(--violet-500)" }
                        : undefined
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="p-5 pt-3">
                <PathPreview track={track} />
              </div>
              <div
                className="px-5 py-3 border-t flex items-center justify-between text-caption"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface-tertiary)", color: "var(--color-text-muted)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {TRACKS[track].stats.coverage} prerequisites covered
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={13} style={{ color: "var(--violet-500)" }} /> {TRACKS[track].stats.steps}
                </span>
              </div>
            </div>
            <div className="absolute -z-10 -right-6 -bottom-6 h-32 w-32 rounded-full blur-2xl opacity-[0.08]" style={{ background: "radial-gradient(circle, var(--violet-500) 0%, transparent 70%)" }} />
          </motion.div>
        </div>
      </main>

      {/* How it works */}
      <section id="how" className="relative container-page mx-auto px-6 py-14 md:py-16">
        <div className="max-w-2xl">
          <div className="section-eyebrow mb-2">How PadhAI works</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "40px", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-1.0px" }}>
            From ambition to an ordered roadmap
          </h2>
          <p className="mt-3" style={{ color: "var(--color-text-muted)", fontSize: "16px", lineHeight: 1.5 }}>
            Three deliberate steps — no magic, just mapping.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <HowCard n="01" title="Understand your goal" desc="We parse your natural language goal into role, domain, timeline and detected skills." />
          <HowCard n="02" title="Map your start" desc="Your profile, interests and study time calibrate difficulty and gap priority." />
          <HowCard n="03" title="Build the path" desc="We topologically order resources by prerequisites and rank by evidence, not randomness." />
        </div>
      </section>

      {/* Personalized path */}
      <section className="relative container-page mx-auto px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <div>
            <div className="section-eyebrow mb-2">Personalized path</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.6px" }}>
              An ordered path, not a playlist
            </h2>
            <p className="mt-3" style={{ color: "var(--color-text-muted)", fontSize: "15px", lineHeight: 1.5 }}>
              Current skills → gaps → prerequisites → milestones → goal. Nodes communicate status at a glance.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="pill" style={{ borderColor: "rgba(61,220,132,0.25)", color: "var(--green-400)" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--green-400)" }} /> Completed
              </span>
              <span className="pill" style={{ borderColor: "rgba(131,56,236,0.25)", color: "var(--violet-500)" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--violet-500)" }} /> Current
              </span>
              <span className="pill" style={{ borderColor: "rgba(251,86,7,0.25)", color: "var(--orange-500)" }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--orange-500)" }} /> Recommended
              </span>
              <span className="pill" style={{ opacity: 0.6 }}>
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-text-muted)" }} /> Locked
              </span>
            </div>
          </div>
          <Card>
            <div className="text-caption font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)", letterSpacing: "0.4px" }}>
              Example · Frontend Engineer · 6 months
            </div>
            <div className="space-y-2">
              <InlineNode label="HTML & CSS" meta="✓ Completed · 10h" tone="success" />
              <InlineNode label="JavaScript Fundamentals" meta="Current · 15h · unlocks React" tone="brand" />
              <InlineNode label="React Development" meta="Recommended · prereq: JS" tone="accent" />
              <InlineNode label="Capstone Project: Build with Frontend" meta="Locked · milestone" tone="muted" />
            </div>
          </Card>
        </div>
      </section>

      {/* Skill gap */}
      <section className="relative container-page mx-auto px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div>
            <div className="section-eyebrow mb-2">Skill gaps, exposed</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.6px" }}>
              See exactly where you stand
            </h2>
            <p className="mt-3" style={{ color: "var(--color-text-muted)", fontSize: "15px" }}>Skill bars make gaps legible. Priority gaps drive what comes next.</p>
            <div className="rounded-xl border p-5 mt-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="space-y-4">
                <SkillRow label="HTML" value={88} tone="success" />
                <SkillRow label="CSS" value={72} tone="success" />
                <SkillRow label="JavaScript" value={41} tone="accent" />
                <SkillRow label="React" value={18} tone="brand" />
              </div>
              <div className="mt-6 rounded-lg border p-3" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
                <div className="text-caption font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                  Priority gaps
                </div>
                <ol className="mt-2 space-y-1 text-body-sm list-decimal list-inside" style={{ color: "var(--color-text-muted)" }}>
                  <li>JavaScript → unlocks every Frontend module</li>
                  <li>React → your target-role core</li>
                  <li>Responsive Design → portfolio readiness</li>
                </ol>
              </div>
            </div>
          </div>
          <Card>
            <div className="text-caption font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              Why this is next
            </div>
            <h3 className="text-title mt-2" style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.4px" }}>
              JavaScript Fundamentals
            </h3>
            <p className="text-body-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
              Your HTML is solid, but JavaScript is the unlock for React. Finishing it clears the prerequisite for 4 downstream nodes.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-caption">
              <div className="rounded-lg border p-3" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
                <div style={{ color: "var(--color-text-muted)" }}>Skill gap addressed</div>
                <div className="font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-mono)" }}>
                  JavaScript
                </div>
              </div>
              <div className="rounded-lg border p-3" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
                <div style={{ color: "var(--color-text-muted)" }}>Prerequisite coverage</div>
                <div className="font-semibold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>
                  94%
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Adaptive */}
      <section className="relative container-page mx-auto px-6 py-10">
        <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8">
              <div className="section-eyebrow mb-2 inline-flex items-center gap-2">
                <SlidersHorizontal size={14} style={{ color: "var(--violet-500)" }} /> Adaptive
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 600, letterSpacing: "-0.6px" }}>What if your schedule changes?</h2>
              <p className="mt-3" style={{ color: "var(--color-text-muted)" }}>Adjust study time and the path re-plans — no rebuild from scratch.</p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border p-3" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
                  <div className="text-caption" style={{ color: "var(--color-text-muted)" }}>Current</div>
                  <div className="font-semibold" style={{ fontFamily: "var(--font-mono)" }}>6h/week</div>
                  <div className="text-caption" style={{ color: "var(--color-text-muted)" }}>8 months</div>
                </div>
                <div className="rounded-lg border p-3" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
                  <div className="text-caption" style={{ color: "var(--color-text-muted)" }}>Simulate</div>
                  <div className="font-semibold" style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>3h/week</div>
                  <div className="text-caption" style={{ color: "var(--color-text-muted)" }}>→ 11 months</div>
                </div>
                <div className="rounded-lg border p-3" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
                  <div className="text-caption" style={{ color: "var(--color-text-muted)" }}>Kept</div>
                  <div className="font-semibold">Core + Project</div>
                  <div className="text-caption" style={{ color: "var(--color-text-muted)" }}>−2 optional</div>
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={() =>
                    navigate(!token ? "/register" : !learnerId ? "/onboarding" : "/simulation")
                  }
                >
                  Try the simulation <ArrowRight size={16} />
                </Button>
              </div>
            </div>
            <div className="p-6 flex items-center border-t lg:border-t-0 lg:border-l" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
              <div className="w-full space-y-3 text-body-sm">
                <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                  <Clock size={14} /> Timeline re-estimated
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-full" style={{ width: "62%", background: "var(--violet-500)" }} />
                </div>
                <div className="flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                  <BadgeCheck size={14} style={{ color: "var(--green-400)" }} /> Milestones preserved
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-full" style={{ width: "84%", background: "var(--green-400)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Mentor */}
      <section className="relative container-page mx-auto px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Card>
            <div className="inline-flex items-center gap-2 text-caption font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              <MessageCircle size={14} style={{ color: "var(--violet-500)" }} /> AI Mentor
            </div>
            <h2 className="mt-2" style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 600, letterSpacing: "-0.6px" }}>
              Contextual, not generic
            </h2>
            <p className="mt-3" style={{ color: "var(--color-text-muted)" }}>
              The mentor knows your goal, path and progress — answers stay grounded in evidence, never invented courses.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="pill text-caption">Why is this next?</span>
              <span className="pill text-caption">Can I skip this?</span>
              <span className="pill text-caption">Am I on track?</span>
              <span className="pill text-caption">What should I build?</span>
            </div>
          </Card>
          <div className="rounded-xl border p-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="space-y-3 text-body-sm">
              <div className="rounded-lg border p-3" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
                Why is React next?
              </div>
              <div className="rounded-lg border p-3" style={{ background: "rgba(131,56,236,0.08)", borderColor: "rgba(131,56,236,0.16)" }}>
                Because your JavaScript gap is 59% and React depends on it. Completing JS unlocks 4 nodes and keeps you on your Frontend timeline.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature trio */}
      <section className="relative container-page mx-auto px-6 pb-2">
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature icon={<Compass size={20} style={{ color: "var(--violet-500)" }} />} title="Goal to direction" body="Turn an ambition into a sequenced, navigable path." />
          <Feature icon={<GitBranch size={20} style={{ color: "var(--violet-500)" }} />} title="Skill gaps exposed" body="See exactly where you are versus where you need to be." />
          <Feature icon={<ShieldCheck size={20} style={{ color: "var(--violet-500)" }} />} title="Evidence-backed" body="Every recommendation cites real learner reviews." />
        </div>
      </section>

      {/* Final CTA — Linear cta-banner: surface #1C1E21, 48px padding, headline 28px/600/-0.6 */}
      <section className="relative container-page mx-auto px-6 py-12">
        <div
          className="rounded-xl border p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          style={{
            background: "linear-gradient(145deg, #24183A 0%, #1C1E21 50%, #111214 100%)",
            borderColor: "rgba(131,56,236,.28)",
          }}
        >
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 600, letterSpacing: "-0.6px" }}>Ready to map your path?</h2>
            <p className="mt-2" style={{ color: "var(--color-text-muted)" }}>
              Start with your goal. PadhAI does the sequencing.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate(!token ? "/register" : !learnerId ? "/onboarding" : "/dashboard")}
          >
            Build my learning path <ArrowRight size={18} />
          </Button>
        </div>
        <footer className="mt-10 flex items-center justify-between text-caption border-t pt-6" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
          <span>© {new Date().getFullYear()} PadhAI · Tera Raasta, AI ke Saath · Paths, not playlists.</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} /> Evidence-backed
          </span>
        </footer>
      </section>
    </div>
  );
}

function HowCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="text-caption font-mono" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
        {n}
      </div>
      <h3 className="mt-2" style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.4px" }}>
        {title}
      </h3>
      <p className="mt-1" style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: 1.5 }}>
        {desc}
      </p>
    </div>
  );
}

function InlineNode({ label, meta, tone }: { label: string; meta: string; tone: "success" | "brand" | "accent" | "muted" }) {
  const dot = tone === "success" ? "var(--green-400)" : tone === "brand" ? "var(--violet-500)" : tone === "accent" ? "var(--orange-500)" : "var(--color-text-muted)";
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ background: "var(--color-surface-tertiary)", borderColor: "var(--color-border)" }}>
      <span className="inline-flex items-center gap-2 font-medium" style={{ fontSize: "14px" }}>
        <span className="h-2 w-2 rounded-full" style={{ background: dot }} /> {label}
      </span>
      <span className="text-caption" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
        {meta}
      </span>
    </div>
  );
}

function SkillRow({ label, value, tone }: { label: string; value: number; tone: "brand" | "success" | "accent" }) {
  const color = tone === "success" ? "var(--green-400)" : tone === "accent" ? "var(--orange-500)" : "var(--violet-500)";
  return (
    <div>
      <div className="flex items-center justify-between text-body-sm">
        <span className="font-medium" style={{ fontSize: "14px" }}>
          {label}
        </span>
        <span style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{value}%</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function PathPreview({ track }: { track: Track }) {
  const nodes = TRACKS[track].nodes;
  return (
    <div className="space-y-3">
      {nodes.map((n, i) => (
        <div key={n.k} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className="h-2.5 w-2.5 rounded-full mt-1"
              style={{
                background: n.tone === "success" ? "var(--green-400)" : n.tone === "brand" ? "var(--violet-500)" : n.tone === "accent" ? "var(--orange-500)" : "var(--color-text-muted)",
              }}
            />
            {i < nodes.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--color-border)" }} />}
          </div>
          <div className="pb-3">
            <div className="text-caption font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)", letterSpacing: "0.4px", fontFamily: "var(--font-sans)" }}>
              {n.k}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {n.items.map((it) => (
                <span key={it} className="pill text-xs" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                  {it}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="mb-3">{icon}</div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 500, letterSpacing: "-0.2px" }}>{title}</h3>
      <p className="mt-1" style={{ color: "var(--color-text-muted)", fontSize: "14px", lineHeight: 1.5 }}>
        {body}
      </p>
    </div>
  );
}
