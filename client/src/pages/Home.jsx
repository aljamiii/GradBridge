import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { Button, cx } from "../components/ui";

/* ------------------------------------------------------------------- data */

const FEATURES = [
  {
    icon: "wallet",
    title: "Cost, in taka you understand",
    body: "AI estimates tuition, housing, insurance and living costs for your city and lifestyle, then converts them at today's rate — so the number means something.",
  },
  {
    icon: "target",
    title: "Eligibility, honestly assessed",
    body: "Your CGPA, English score and research background compared against what a program actually asks for — with the specific gaps and how to close them.",
  },
  {
    icon: "gift",
    title: "Scholarships, found for you",
    body: "A scraper reads Scholars4Dev and DAAD daily, an AI structures each listing, and an admin approves it before it reaches you.",
  },
  {
    icon: "globe",
    title: "Answers grounded in real guides",
    body: "Ask anything about living in a city. Answers come from a curated knowledge base with live weather — and it says so when it doesn't know.",
  },
  {
    icon: "map",
    title: "People already living there",
    body: "See Bangladeshi students on a world map, filter by who can help with visas or housing, check who's online, and message them directly.",
  },
  {
    icon: "passport",
    title: "Visa paperwork, sequenced",
    body: "A checklist built for Bangladeshi applicants — police clearance, bank solvency, embassy specifics — ordered by what takes longest.",
  },
];

const STEPS = [
  { title: "Build your profile", body: "Degree, CGPA, budget, and what you actually care about in a country." },
  { title: "Explore with data", body: "Costs, scholarships, eligibility and life-fit — all scored against that profile." },
  { title: "Talk to people", body: "Match with verified mentors, book sessions, reach students already abroad." },
  { title: "Land prepared", body: "Visa checklist, neighbourhood guide, job market and PR points for after graduation." },
];

const STATS = [
  { value: "16", label: "Decision tools" },
  { value: "6", label: "Live data sources" },
  { value: "$0", label: "Cost to students" },
  { value: "100%", label: "Open free stack" },
];

const FAQS = [
  {
    q: "Is GradBridge really free?",
    a: "Yes — every service behind it runs on a free tier: MongoDB Atlas, Google Gemini, OpenStreetMap, Adzuna and OpenWeather. There is no paid plan and no card required.",
  },
  {
    q: "Where does the AI get its information?",
    a: "It depends on the feature. Cost and eligibility use Gemini with live exchange rates. The destination advisor uses retrieval over a curated knowledge base and refuses to answer beyond it. Mentor matching and PR points use transparent rules, no AI at all.",
  },
  {
    q: "Who can see my profile?",
    a: "Nothing is public by default. You only appear on the network map if you explicitly opt in, and even then only your city, university, degree and subject are shared — never your contact details.",
  },
  {
    q: "Is this only for Bangladeshi students?",
    a: "The platform is built around Bangladeshi realities — taka conversions, police clearance certificates, halal food and community mapping, local embassy processes. Anyone can use it, but that's who it's designed for.",
  },
];

/* ------------------------------------------------------------- components */

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left">
        <span className="font-semibold text-ink-900">{q}</span>
        <Icon name="chevronDown"
          className={cx("h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <p className="animate-rise pb-5 pr-8 text-sm leading-relaxed text-ink-500">{a}</p>}
    </div>
  );
}

// A miniature, non-interactive rendering of the product — gives the hero
// something to show without needing screenshots or external images.
function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Deliberately opaque: this is a picture of a screen, so blurring it
          would break the illusion that you're looking at the product. */}
      <div className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[var(--shadow-float)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 rounded-md bg-white px-2.5 py-1 text-[11px] text-ink-400 ring-1 ring-slate-200">
            gradbridge.app/dashboard
          </span>
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-44 shrink-0 border-r border-slate-200/80 p-3 sm:block">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Icon name="bridge" className="h-3 w-3" strokeWidth={2.2} />
              </span>
              <span className="text-[11px] font-extrabold text-ink-900">GradBridge</span>
            </div>
            {[
              { icon: "home", label: "Dashboard", active: true },
              { icon: "graduation", label: "Universities" },
              { icon: "gift", label: "Scholarships" },
              { icon: "map", label: "Network Map" },
              { icon: "wallet", label: "Cost Predictor" },
              { icon: "target", label: "Eligibility" },
            ].map((i) => (
              <div key={i.label}
                className={cx("mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium",
                  i.active ? "bg-brand-50 text-brand-700" : "text-ink-400")}>
                <Icon name={i.icon} className="h-3.5 w-3.5" />
                {i.label}
              </div>
            ))}
          </div>

          {/* mini content */}
          <div className="min-w-0 flex-1 p-4">
            <div className="mb-3 h-2.5 w-40 rounded-full bg-slate-200" />
            <div className="mb-4 h-2 w-64 rounded-full bg-slate-100" />

            <div className="mb-4 grid grid-cols-3 gap-2.5">
              {[
                { v: "$18,400", l: "First-year cost", tone: "text-brand-600" },
                { v: "72 / 100", l: "Life fit — Toronto", tone: "text-emerald-600" },
                { v: "9", l: "Students nearby", tone: "text-amber-600" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-slate-200/80 p-2.5">
                  <p className={cx("text-sm font-bold", s.tone)}>{s.v}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-ink-400">{s.l}</p>
                </div>
              ))}
            </div>

            {/* fake chart */}
            <div className="rounded-lg border border-slate-200/80 p-3">
              <div className="mb-2.5 h-1.5 w-24 rounded-full bg-slate-200" />
              <div className="flex h-16 items-end gap-1.5">
                {[45, 62, 38, 78, 55, 88, 70, 95, 60, 82, 48, 72].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-brand-500/70 to-brand-400/40"
                    style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample outputs, sitting below the mockup so nothing is covered. */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {[
          { icon: "check", tone: "emerald", title: "Eligible", sub: "MSc CS · U of T" },
          { icon: "gift", tone: "amber", title: "4 scholarships", sub: "You qualify for" },
          { icon: "users", tone: "sky", title: "2 mentors", sub: "Matched to you" },
        ].map((c) => (
          <div key={c.title}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-[var(--shadow-card)]">
            <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg",
              c.tone === "emerald" ? "bg-emerald-50 text-emerald-600"
                : c.tone === "amber" ? "bg-amber-50 text-amber-600"
                  : "bg-sky-50 text-sky-600")}>
              <Icon name={c.icon} className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="text-left">
              <p className="text-xs font-bold text-ink-900">{c.title}</p>
              <p className="text-[10px] text-ink-400">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex-1">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-48 h-[38rem] bg-[radial-gradient(55rem_26rem_at_50%_0%,rgb(99_102_241/0.18),transparent_70%)]" />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-rise mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/80 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Sixteen tools · One profile · Zero cost
            </div>

            <h1 className="animate-rise text-4xl font-extrabold leading-[1.06] tracking-tight text-ink-900 sm:text-6xl">
              Study abroad,
              <br />
              <span className="text-gradient">decided smarter.</span>
            </h1>

            <p className="animate-rise mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-500 sm:text-lg">
              Most Bangladeshi students plan the biggest move of their life from
              Facebook groups and agent hearsay. GradBridge replaces that with
              real numbers, honest assessments, and people who already made it.
            </p>

            <div className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Button to="/dashboard" size="lg">
                  Go to your dashboard <Icon name="arrowRight" className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button to="/register" size="lg">
                    Start free <Icon name="arrowRight" className="h-4 w-4" />
                  </Button>
                  <Button to="/login" variant="secondary" size="lg">I have an account</Button>
                </>
              )}
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-ink-400">
              <Icon name="check" className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.4} />
              No credit card · No paid APIs · Built entirely on free tiers
            </p>
          </div>

          <div className="animate-rise mt-16">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- stats */}
      <section className="border-y border-slate-200/70 bg-white/60">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-ink-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-600">What you get</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Every question you can&apos;t Google, answered with your own numbers
          </h2>
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Icon name={f.icon} />
              </span>
              <h3 className="text-base font-bold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- how it works */}
      <section id="how" className="scroll-mt-20 bg-ink-900 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-400">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From “where do I even start?” to boarding pass
            </h2>
          </div>

          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="hidden h-px flex-1 bg-white/10 lg:block" />
                  )}
                </div>
                <h3 className="mt-5 text-base font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-600">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Questions worth asking
          </h2>
        </div>
        <div className="mt-10">
          {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      {!user && (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-16 text-center shadow-[var(--shadow-float)] sm:px-12">
            <div aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(32rem_18rem_at_20%_0%,rgb(255_255_255/0.2),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your plan starts with one profile.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-brand-100">
                Fill in your degree, CGPA and budget once — every tool on the
                platform personalises itself around it.
              </p>
              <Button to="/register" size="lg" className="mt-9 bg-white text-brand-700 shadow-lg hover:bg-brand-50">
                Create your free account <Icon name="arrowRight" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-white/5 bg-ink-900 text-slate-400">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="flex items-center gap-2.5 text-base font-bold text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                  <Icon name="bridge" className="h-4 w-4" strokeWidth={2} />
                </span>
                GradBridge
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed">
                An AI-powered study abroad decision and life-readiness platform,
                built for Bangladeshi students on a completely free stack.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white">Platform</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href="#features" className="transition-colors hover:text-white">Features</a></li>
                <li><a href="#how" className="transition-colors hover:text-white">How it works</a></li>
                <li><a href="#faq" className="transition-colors hover:text-white">FAQ</a></li>
                <li><Link to="/register" className="transition-colors hover:text-white">Get started</Link></li>
              </ul>
            </div>

          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-xs">
            © {new Date().getFullYear()} GradBridge. Built with React, Node.js, MongoDB and Gemini.
          </div>
        </div>
      </footer>
    </div>
  );
}
