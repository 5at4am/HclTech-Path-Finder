import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Compass, GitBranch, Route, MessageSquare,
  Sparkles, type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

/* Orchestrated page-load: content rises in while the route draws itself. */
const EASE = [0.21, 0.65, 0.36, 1] as const;

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ---- Signature element: the route line ----------------------------------
   An SVG path draws itself through three waypoints (goal → gaps → path),
   mirroring exactly what the product does. Dashed continuation hints there
   is more road ahead. */
function RoutePreview() {
  const d = "M 34 238 C 92 232, 122 192, 152 166 S 232 122, 266 106 S 352 72, 388 46";
  const ghost = "M 388 46 C 400 37, 408 32, 418 28";
  return (
    <div className="glass relative overflow-hidden rounded-panel p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(rgba(148,163,184,0.13) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div className="aurora-blob animate-aurora right-[-70px] top-[-80px] h-56 w-56 bg-accent/25" aria-hidden />
      <div className="aurora-blob animate-aurora-slow bottom-[-90px] left-[-60px] h-52 w-52 bg-progress/20" aria-hidden />

      <p className="section-eyebrow">Path preview</p>
      <svg viewBox="0 0 420 290" className="relative mt-3 w-full" role="img" aria-label="A route drawing itself from your goal to your target role">
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>

        {/* planned-but-unwalked remainder */}
        <motion.path
          d={ghost}
          fill="none"
          stroke="#687592"
          strokeWidth="1.5"
          strokeDasharray="3 7"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 2.2, duration: 0.6 }}
        />

        {/* the walked route */}
        <motion.path
          d={d}
          fill="none"
          stroke="url(#routeGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 1.7, ease: "easeInOut" }}
        />

        {/* waypoint pulses */}
        {([
          { cx: 34, cy: 238, label: "Today", anchor: "start", lx: 20, ly: 268, t: 0.5 },
          { cx: 152, cy: 166, label: "Gaps found", anchor: "middle", lx: 152, ly: 148, t: 1.05 },
          { cx: 266, cy: 106, label: "Path built", anchor: "middle", lx: 266, ly: 88, t: 1.5 },
          { cx: 388, cy: 46, label: "AI / ML Engineer", anchor: "end", lx: 396, ly: 30, t: 1.95 },
        ] as const).map((w) => (
          <g key={w.label}>
            <motion.circle
              cx={w.cx} cy={w.cy} r="10" fill="none" stroke="url(#routeGrad)" strokeWidth="1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.6, 1], opacity: [0, 0.9, 0.35] }}
              transition={{ delay: w.t, duration: 0.9, times: [0, 0.4, 1] }}
              style={{ transformOrigin: `${w.cx}px ${w.cy}px` }}
            />
            <motion.circle
              cx={w.cx} cy={w.cy} r="4.5" fill="#EDF1FA"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: w.t, type: "spring", stiffness: 380, damping: 16 }}
              style={{ transformOrigin: `${w.cx}px ${w.cy}px` }}
            />
            <motion.text
              x={w.lx} y={w.ly} textAnchor={w.anchor}
              className="fill-secondary text-[12px] font-medium tracking-wide"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: w.t + 0.15, duration: 0.45 }}
              style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}
            >
              {w.label}
            </motion.text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---- Sections ------------------------------------------------------------ */

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Compass, title: "State your goal", body: "One sentence is enough. Pathwise extracts the role, timeline, and outcome." },
  { icon: GitBranch, title: "Find your gaps", body: "We compare what you know now against what the role demands — skill by skill." },
  { icon: Route, title: "Follow your path", body: "Courses, projects, and assessments ordered by prerequisites. Never a flat list." },
  { icon: MessageSquare, title: "Understand each step", body: "Ask \u201Cwhy this?\u201D at any point. Answers come from your actual path, not generic advice." },
];

const GAP_BARS: [string, number][] = [
  ["Python", 88], ["SQL", 68], ["Statistics", 49], ["Machine Learning", 31], ["Deep Learning", 12],
];

export default function Landing() {
  return (
    <div className="app-bg min-h-screen">
      {/* ambient aurora behind the whole hero */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] overflow-hidden" aria-hidden>
        <div className="aurora-blob animate-aurora left-[12%] top-[-140px] h-[384px] w-[384px] bg-accent/15" />
        <div className="aurora-blob animate-aurora-slow right-[8%] top-[40px] h-[320px] w-[320px] bg-progress/10" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/50 glass">
        <div className="container-page flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-[32px] w-[32px] place-items-center rounded-btn bg-route text-white"><Compass size={18} /></span>
            <span className="font-display text-lg font-bold tracking-tight">Pathwise</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
            <a href="#how" className="transition-colors hover:text-primary">How it works</a>
            <a href="#personalization" className="transition-colors hover:text-primary">Personalization</a>
            <a href="#mentor" className="transition-colors hover:text-primary">AI Mentor</a>
          </nav>
          <Link to="/onboarding" className="btn-ghost hidden md:inline-flex">Sign in</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container-page relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="section-eyebrow">AI-personalized learning</span>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.04] tracking-tight md:text-6xl">
            Your goal.
            <br />
            <span className="text-gradient">Your learning path.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-secondary">
            Describe where you want to go in plain words. Pathwise maps what you already
            know, finds the gaps, and sequences exactly what to learn next — with a
            reason for every step.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/onboarding" className="btn-primary">
              Build my learning path <ArrowRight size={16} />
            </Link>
            <a href="#how" className="btn-ghost">See how it works</a>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
        >
          <RoutePreview />
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how" className="container-page scroll-mt-24 py-16">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight">From sentence to roadmap</h2>
          <p className="mt-2 max-w-xl text-secondary">Four stages turn what you typed into a sequenced plan.</p>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="card group h-full p-5 transition-colors duration-200 hover:border-accent/40">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-btn bg-accent-soft text-accent transition-transform duration-200 group-hover:scale-110">
                    <s.icon size={20} />
                  </span>
                  <span className="meta">Step 0{i + 1}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-primary">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Personalization + gaps */}
      <section id="personalization" className="container-page scroll-mt-24 py-16">
        <div className="grid items-start gap-6 md:grid-cols-2">
          <Reveal>
            <div className="card h-full p-6">
              <p className="section-eyebrow">Personalization</p>
              <h3 className="mt-2 font-display text-2xl font-bold">Built around your starting point</h3>
              <p className="mt-2 leading-relaxed text-secondary">
                Same goal, different learners, different paths. Yours adapts to your
                experience, your weekly hours, and what you actually care about.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-secondary">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />Already strong in Python? Skip ahead.</li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-progress" aria-hidden />Three hours a week? The timeline stretches — not the workload.</li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-info" aria-hidden />Curious about GenAI? Electives shift toward LLMs and RAG.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full p-6">
              <p className="section-eyebrow">Skill gaps</p>
              <h3 className="mt-2 font-display text-2xl font-bold">See exactly what's missing</h3>
              <div className="mt-5 space-y-3.5">
                {GAP_BARS.map(([k, v], i) => (
                  <div key={k}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-primary">{k}</span>
                      <span className="tabular-nums text-secondary">{v}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-accent to-progress"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${v}%` }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.9, delay: i * 0.07, ease: EASE }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Adaptive */}
      <section id="adaptive" className="container-page scroll-mt-24 py-16">
        <Reveal>
          <div className="glass flex flex-col items-start gap-4 rounded-panel p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-eyebrow">Adaptive</p>
              <h3 className="mt-2 font-display text-2xl font-bold">Your path changes as you learn</h3>
              <p className="mt-2 max-w-lg leading-relaxed text-secondary">
                Mark a resource too difficult or already known, and Pathwise regenerates
                the next steps around your real progress — mid-journey, not next semester.
              </p>
            </div>
            <Sparkles className="h-[48px] w-[48px] shrink-0 text-accent" aria-hidden />
          </div>
        </Reveal>
      </section>

      {/* Mentor */}
      <section id="mentor" className="container-page scroll-mt-24 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <Reveal className="order-2 md:order-1">
            <p className="section-eyebrow">AI Mentor</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Ask anything about your path</h3>
            <p className="mt-2 leading-relaxed text-secondary">
              The mentor answers from your actual path — your courses, your progress,
              your prerequisites — never generic advice.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Why is this next?", "What should I learn today?", "Am I on track?"].map((q) => (
                <span key={q} className="pill"><MessageSquare size={12} /> {q}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="order-1 md:order-2">
            <div className="card p-6">
              <div className="mb-3 flex items-center gap-2 font-medium text-accent"><Sparkles size={16} /> Pathwise Mentor</div>
              <div className="space-y-3">
                <div className="rounded-btn rounded-bl-sm bg-surface p-3 text-sm text-secondary">
                  Why statistics before machine learning?
                </div>
                <motion.div
                  className="rounded-btn rounded-br-sm bg-accent-soft p-3 text-sm leading-relaxed text-primary"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  ML leans on distributions, hypothesis testing, and evaluation. Your path
                  places statistics first so every later module lands on solid ground.
                </motion.div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-panel p-[1px]">
            <div className="absolute inset-0 bg-route opacity-60" aria-hidden />
            <div className="relative flex flex-col items-center gap-5 rounded-panel bg-elevated px-8 py-12 text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight">Start with one sentence</h2>
              <p className="max-w-md text-secondary">No setup. Tell Pathwise where you want to go — it charts the rest.</p>
              <Link to="/onboarding" className="btn-primary">Build my learning path <ArrowRight size={16} /></Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="container-page border-t border-border py-8 text-sm text-muted">
        Pathwise — personalized learning paths. Built for the HCL hackathon.
      </footer>
    </div>
  );
}
