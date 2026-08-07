import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function StatusChip({ ok, okText, badText }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        ok
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          ok ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />

      {ok ? okText : badText}
    </span>
  );
}


const features = [
  {
    icon: "🎓",
    title: "Find the right university",
    description:
      "Explore universities, programs, scholarships, and admission opportunities in one place.",
  },
  {
    icon: "💰",
    title: "Understand the real cost",
    description:
      "Estimate tuition, living expenses, travel costs, and financial risk before making a decision.",
  },
  {
    icon: "🎯",
    title: "Check your readiness",
    description:
      "Evaluate eligibility, destination compatibility, visa preparation, and your overall study plan.",
  },
  {
    icon: "🧭",
    title: "Prepare for life abroad",
    description:
      "Find mosques, halal food, hospitals, transit, and other essentials around your future campus.",
  },
  {
    icon: "🗺️",
    title: "Find your community",
    description:
      "Discover Bangladeshi students abroad and build a support network before you arrive.",
  },
  {
    icon: "🧑‍🏫",
    title: "Learn from mentors",
    description:
      "Connect with experienced mentors who can help you navigate study-abroad decisions.",
  },
];


const journeySteps = [
  {
    number: "01",
    title: "Explore",
    description:
      "Research universities, scholarships, destinations, and opportunities.",
  },
  {
    number: "02",
    title: "Evaluate",
    description:
      "Compare eligibility, costs, financial risk, and destination compatibility.",
  },
  {
    number: "03",
    title: "Prepare",
    description:
      "Plan your visa, daily life, community connections, and transition abroad.",
  },
];


export default function Home() {
  const { user } = useAuth();

  const [health, setHealth] = useState(null);
  const [error, setError] = useState(false);


  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, []);


  return (
    <main className="flex-1">

      {/* HERO */}

      <section className="relative overflow-hidden">

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8 lg:py-24">

          {/* LEFT SIDE */}

          <div className="relative z-10">

            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Study abroad, with clarity
            </div>


            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Make better decisions
              <span className="block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                before studying abroad.
              </span>
            </h1>


            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              GradBridge brings university research, cost planning,
              eligibility, life-abroad preparation, community, and
              mentoring into one student-focused platform.
            </p>


            <div className="mt-8 flex flex-wrap gap-3">

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
                  >
                    Open Dashboard
                    <span className="ml-2">→</span>
                  </Link>

                  {user.role === "student" && (
                    <Link
                      to="/universities"
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Explore Universities
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
                  >
                    Start Your Journey
                    <span className="ml-2">→</span>
                  </Link>

                  <Link
                    to="/login"
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    Log in
                  </Link>
                </>
              )}

            </div>


            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500">

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] text-emerald-700">
                  ✓
                </span>
                Decision support
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] text-emerald-700">
                  ✓
                </span>
                Life-abroad planning
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] text-emerald-700">
                  ✓
                </span>
                Community support
              </span>

            </div>

          </div>


          {/* RIGHT SIDE / VISUAL CARD */}

          <div className="relative hidden lg:block">

            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl" />

            <div className="absolute -bottom-10 right-0 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />


            <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-200/70">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                    GradBridge
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Your study-abroad workspace
                  </h2>
                </div>


                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl text-white shadow-md shadow-indigo-200">
                  G
                </div>

              </div>


              <div className="mt-6 grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-indigo-50 p-4">
                  <div className="text-2xl">🎓</div>

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Universities
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Research programs and opportunities.
                  </p>
                </div>


                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-2xl">💰</div>

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Cost Planning
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Understand real study costs.
                  </p>
                </div>


                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="text-2xl">🧭</div>

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Life Abroad
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Prepare for daily life overseas.
                  </p>
                </div>


                <div className="rounded-2xl bg-violet-50 p-4">
                  <div className="text-2xl">🧑‍🏫</div>

                  <p className="mt-3 text-sm font-semibold text-slate-900">
                    Mentorship
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Learn from experienced people.
                  </p>
                </div>

              </div>


              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                  One platform
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Research, compare, prepare, and connect without
                  jumping between disconnected tools.
                </p>

              </div>

            </div>

          </div>

        </div>


        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/30 blur-3xl" />

      </section>


      {/* FEATURES */}

      <section className="border-y border-slate-200/70 bg-white/70">

        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-xs font-bold uppercase tracking-[0.17em] text-indigo-600">
              One connected platform
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Everything you need before you go
            </h2>

            <p className="mt-4 leading-7 text-slate-500">
              GradBridge helps you move from uncertainty to a more
              informed study-abroad plan.
            </p>

          </div>


          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {features.map((feature) => (

              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-2xl ring-1 ring-indigo-100">
                  {feature.icon}
                </div>


                <h3 className="mt-5 text-base font-semibold text-slate-900 transition group-hover:text-indigo-700">
                  {feature.title}
                </h3>


                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* JOURNEY */}

      <section>

        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">

          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.17em] text-indigo-600">
                Your journey
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                From research to readiness
              </h2>

              <p className="mt-4 max-w-lg leading-7 text-slate-500">
                Studying abroad involves much more than choosing a
                university. GradBridge helps you think through the
                entire journey.
              </p>


              {!user && (
                <Link
                  to="/register"
                  className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Create your account
                  <span className="ml-2">→</span>
                </Link>
              )}

            </div>


            <div className="space-y-3">

              {journeySteps.map((step) => (

                <div
                  key={step.number}
                  className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                    {step.number}
                  </div>


                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {step.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {step.description}
                    </p>
                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </section>


      {/* SYSTEM STATUS */}

      <section className="border-t border-slate-200/70 bg-slate-50/80">

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Platform status
            </p>

            <p className="mt-1 text-xs text-slate-400">
              GradBridge service connectivity
            </p>
          </div>


          <div className="flex flex-wrap gap-2">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs text-slate-500">
                API
              </span>

              <StatusChip
                ok={!!health}
                okText="Running"
                badText={error ? "Unavailable" : "Checking…"}
              />
            </div>


            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs text-slate-500">
                Database
              </span>

              <StatusChip
                ok={health?.database === "connected"}
                okText="Connected"
                badText="Not connected"
              />
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}