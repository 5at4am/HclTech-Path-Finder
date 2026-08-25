import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Compass, GitBranch, Route, MessageSquare,
  Sparkles, type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { SpotlightCard, EvidencePanel } from "../components/ui";

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
            backgroundImage: "radial-gradient(rgba(131,56,236,0.10) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
      <div className="aurora-blob animate-aurora right-[-70px] top-[-80px] h-56 w-56" aria-hidden />
      <div className="aurora-blob animate-aurora-slow bottom-[-90px] left-[-60px] h-52 w-52 bg-accent-soft" aria-hidden />

      <p className="section-eyebrow">Path preview</p>
      <svg viewBox="0 0 420 290" className="relative mt-3 w-full" role="img" aria-label="A route drawing itself from your goal to your target role">
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--color-brand-active)" />
        <stop offset="100%" stopColor="var(--color-brand)" />
          </linearGradient>
        </defs>

        {/* planned-but-unwalked remainder */}
        <motion.path
          d={ghost}
          fill="none"
          stroke="var(--color-border-strong)"
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
               cx={w.cx} cy={w.cy} r="4.5" fill="var(--color-brand)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: w.t, type: "spring", bounce: 0.2, duration: 0.45 }}
              style={{ transformOrigin: `${w.cx}px ${w.cy}px` }}
            />
            <motion.text
              x={w.lx} y={w.ly} textAnchor={w.anchor}
              className="fill-secondary text-xs font-medium tracking-wide"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: w.t + 0.15, duration: 0.45 }}
              style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
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
  { icon: Compass, title: "State your goal", body: "One sentence is enough. Astrolabe extracts the role, timeline, and outcome." },
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
        <div className="aurora-blob animate-aurora left-[12%] top-[-140px] h-[384px] w-[384px]" />
        <div className="aurora-blob animate-aurora-slow right-[8%] top-[40px] h-[320px] w-[320px] bg-accent-soft" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/50 glass">
        <div className="container-page flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-[32px] w-[32px] place-items-center rounded-btn bg-route text-white"><Compass size={18} /></span>
            <span className="font-display text-lg font-bold tracking-tight">Astrolabe</span>
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
            <span className="text-primary">Your learning path.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-secondary">
            Describe where you want to go in plain words. Astrolabe maps what you already
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

      {/* Domain breadth strip — the catalog spans every track below. */}
      <section className="marquee border-y border-border/60 py-4" aria-label="Domains covered">
        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={dup === 1}>
              {["Frontend", "Backend", "Mobile", "Data Science", "Machine Learning", "Generative AI", "Cloud", "DevOps", "Security", "Blockchain"].map((d) => (
                <span key={d} className="flex items-center gap-3 text-sm font-medium text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-route inline-block" aria-hidden />
                  {d}
                </span>
              ))}
            </div>
          ))}
        </div>
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
              <div className="card group h-full p-5 transition-colors duration-200 hover:border-accent-soft">
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

      {/* Bento — one dominant product tile anchors; supporting tiles vary in
          size so hierarchy, not uniformity, guides the eye. */}
      <section id="personalization" className="container-page scroll-mt-24 py-16">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight">Built around you</h2>
          <p className="mt-2 max-w-xl text-secondary">
            Same goal, different learners, different paths — adapted as you learn.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
          {/* Dominant tile: the mentor, showing real product UI */}
          <SpotlightCard className="card rounded-card p-6 lg:col-span-2 lg:row-span-2">
            <div id="mentor" className="scroll-mt-24">
              <p className="section-eyebrow">AI Mentor</p>
              <h3 className="mt-2 font-display text-2xl font-bold">Ask anything about your path</h3>
              <p className="mt-2 max-w-md leading-relaxed text-secondary">
                Answers come from your actual courses, progress, and prerequisites — never generic advice.
              </p>
              <div className="mt-5 space-y-3">
                <div className="max-w-sm rounded-btn rounded-bl-sm bg-surface p-3 text-sm text-secondary">
                  Why statistics before machine learning?
                </div>
                <EvidencePanel
                  evidence={{
                    course_signatures: [
                      "Association rule mining with Apriori and anomaly detection rounded out the unsupervised toolkit.",
                      "Learners who started with statistics reviewed later ML modules as review, not first contact.",
                    ],
                    matched_signatures: [],
                    similarity: 0.81,
                    peer_courses: ["Statistical Learning", "Feature Engineering"],
                    source: "learner reviews",
                  }}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Why is this next?", "What should I learn today?", "Am I on track?"].map((q) => (
                  <span key={q} className="pill"><MessageSquare size={12} /> {q}</span>
                ))}
              </div>
            </div>
          </SpotlightCard>

          {/* Supporting tiles */}
          <SpotlightCard className="card rounded-card p-6">
            <p className="section-eyebrow">Skill gaps</p>
            <h3 className="mt-2 font-display text-lg font-bold">See what's missing</h3>
            <div className="mt-4 space-y-3">
              {GAP_BARS.slice(0, 3).map(([k, v], i) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-primary">{k}</span>
                    <span className="tabular-nums text-secondary">{v}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-progress"
                      style={{ width: `${v}%`, transformOrigin: "left" }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: EASE }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>

          <SpotlightCard className="card rounded-card p-6">
            <p className="section-eyebrow">Personalization</p>
            <h3 className="mt-2 font-display text-lg font-bold">Tuned to your life</h3>
            <ul className="mt-4 space-y-2 text-sm text-secondary">
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />Strong in Python? Skip ahead.</li>
              <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-progress" aria-hidden />3 hrs a week? Timeline stretches, not workload.</li>
            </ul>
          </SpotlightCard>
        </div>

        {/* Wide adaptive tile */}
        <Reveal delay={0.1}>
          <SpotlightCard className="card mt-4 flex flex-col items-start gap-4 rounded-card p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-eyebrow">Adaptive</p>
              <h3 className="mt-2 font-display text-xl font-bold">Your path changes as you learn</h3>
              <p className="mt-2 max-w-lg leading-relaxed text-secondary">
                Mark a resource too difficult or already known, and Astrolabe regenerates
                the next steps around your real progress — mid-journey, not next semester.
              </p>
            </div>
            <Sparkles className="h-10 w-10 shrink-0 text-accent" aria-hidden />
          </SpotlightCard>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="container-page py-16">
        <Reveal>
          <div className="border-beam rounded-panel bg-elevated px-8 py-12 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight">Start with one sentence</h2>
            <p className="mx-auto mt-3 max-w-md text-secondary">No setup. Tell Astrolabe where you want to go — it charts the rest.</p>
            <Link to="/onboarding" className="btn-primary mt-6">Build my learning path <ArrowRight size={16} /></Link>
          </div>
        </Reveal>
      </section>

      <footer className="container-page border-t border-border py-8 text-sm text-muted">
        Astrolabe — personalized learning paths. Built for the HCL hackathon.
      </footer>
    </div>
  );
}
