import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass, GitBranch, Sparkles, ShieldCheck, Route, MessageSquare } from "lucide-react";

function HeroVisual() {
  return (
    <div className="card-elevated relative overflow-hidden p-6">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <p className="section-eyebrow mb-4">Current skills</p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-secondary"><span className="text-success">✓</span> Python</div>
        <div className="flex items-center gap-2 text-secondary"><span className="text-success">✓</span> SQL</div>
      </div>
      <div className="my-3 h-px w-full bg-gradient-to-r from-accent/60 to-transparent" />
      {["Statistics", "Machine Learning", "Deep Learning", "Generative AI", "AI / ML Engineer"].map((n, i) => (
        <motion.div
          key={n}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.12 }}
          className="flex items-center gap-3 py-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className={cxTitle(i)}>{n}</span>
        </motion.div>
      ))}
    </div>
  );
}

function cxTitle(i: number) {
  return i === 4 ? "text-sm font-bold text-accent" : "text-sm text-primary";
}

const STEPS = [
  { icon: Compass, title: "Understand your goal", body: "Describe where you want to go in plain language. We parse the role, timeline and outcome." },
  { icon: GitBranch, title: "Map skill gaps", body: "We compare your current skills to what the target role requires and find the gaps." },
  { icon: Route, title: "Build your path", body: "Resources are ordered by prerequisites into a real sequence, not a flat list." },
  { icon: ShieldCheck, title: "Explain every step", body: "Open any step to see exactly why it is next and what it unlocks." },
];

export default function Landing() {
  return (
    <div className="app-bg min-h-screen">
      <header className="container-page flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-btn bg-accent text-white"><Compass size={18} /></span>
          <span className="text-lg font-bold tracking-tight">Pathwise</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
          <a href="#how" className="hover:text-primary">How it works</a>
          <a href="#personalization" className="hover:text-primary">Personalization</a>
          <a href="#mentor" className="hover:text-primary">AI Mentor</a>
        </nav>
        <Link to="/onboarding" className="btn-ghost hidden md:inline-flex">Sign in</Link>
      </header>

      <section className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="section-eyebrow">AI-personalized learning</span>
          <h1 className="mt-3 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Your goal.
            <br />
            <span className="text-accent">Your learning path.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-secondary">
            Tell Pathwise what you want to achieve. We'll figure out what you need to
            learn next — and explain why.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/onboarding" className="btn-primary">
              Build my learning path <ArrowRight size={16} />
            </Link>
            <a href="#how" className="btn-ghost">See how it works</a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <HeroVisual />
        </motion.div>
      </section>

      <section id="how" className="container-page scroll-mt-20 py-16">
        <h2 className="text-3xl font-bold tracking-tight">How Pathwise works</h2>
        <p className="mt-2 max-w-xl text-secondary">Four stages turn a sentence into a sequenced roadmap.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card p-5">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-btn bg-accent-soft text-accent">
                <s.icon size={20} />
              </div>
              <h3 className="text-base font-semibold text-primary">{s.title}</h3>
              <p className="mt-1.5 text-sm text-secondary">{s.body}</p>
              <span className="meta mt-3 block">0{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="personalization" className="container-page scroll-mt-20 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="card p-6">
            <p className="section-eyebrow">Personalization</p>
            <h3 className="mt-2 text-2xl font-bold">Built around your starting point</h3>
            <p className="mt-2 text-secondary">
              Two learners with the same goal get different paths. We adapt to your
              experience, available time, and interests.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-secondary">
              <li>• Strong Python? Skip ahead.</li>
              <li>• 3 hrs/week? We extend the timeline, not the workload.</li>
              <li>• Interested in GenAI? Electives shift toward LLMs and RAG.</li>
            </ul>
          </div>
          <div className="card p-6">
            <p className="section-eyebrow">Skill gaps</p>
            <h3 className="mt-2 text-2xl font-bold">We show what's missing</h3>
            <div className="mt-4 space-y-3">
              {[["Python", 88], ["SQL", 68], ["Statistics", 49], ["Machine Learning", 31], ["Deep Learning", 12]].map(([k, v]) => (
                <div key={k}>
                  <div className="mb-1 flex justify-between text-sm"><span className="text-primary">{k}</span><span className="text-secondary">{v}%</span></div>
                  <div className="h-2 w-full rounded-full bg-border"><div className="h-2 rounded-full bg-gradient-to-r from-accent to-progress" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="adaptive" className="container-page scroll-mt-20 py-16">
        <div className="card-elevated flex flex-col items-start gap-4 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-eyebrow">Adaptive</p>
            <h3 className="mt-2 text-2xl font-bold">Your path changes as you learn</h3>
            <p className="mt-2 max-w-lg text-secondary">
              Mark something as too difficult or already known, and the next path is
              regenerated around your real progress.
            </p>
          </div>
          <Sparkles className="h-12 w-12 text-accent" />
        </div>
      </section>

      <section id="mentor" className="container-page scroll-mt-20 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <p className="section-eyebrow">AI Mentor</p>
            <h3 className="mt-2 text-2xl font-bold">Ask anything about your path</h3>
            <p className="mt-2 text-secondary">
              "Why is statistics before machine learning?" — the mentor answers from
              your actual path, not generic advice.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Why is this next?", "What should I learn today?", "Am I on track?"].map((q) => (
                <span key={q} className="pill"><MessageSquare size={12} /> {q}</span>
              ))}
            </div>
          </div>
          <div className="order-1 card p-6 md:order-2">
            <div className="mb-3 flex items-center gap-2 text-accent"><Sparkles size={16} /> Pathwise Mentor</div>
            <div className="space-y-3">
              <div className="rounded-btn bg-surface p-3 text-sm text-secondary">Why is statistics before ML?</div>
              <div className="rounded-btn bg-accent-soft p-3 text-sm text-primary">
                Statistics builds the foundations ML relies on — distributions, hypothesis
                testing and evaluation. Your path places it first so later modules make sense.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="card-elevated flex flex-col items-center gap-5 p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Start with your goal</h2>
          <p className="max-w-md text-secondary">No credit card, no setup. Tell us where you want to go.</p>
          <Link to="/onboarding" className="btn-primary">Build my learning path <ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer className="container-page border-t border-border py-8 text-sm text-muted">
        Pathwise — a personalized learning path recommender. Built as a prototype.
      </footer>
    </div>
  );
}
