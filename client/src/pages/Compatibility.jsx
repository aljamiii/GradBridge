import { useState } from "react";
import { api } from "../lib/api";


const COMPONENTS = [
  {
    key: "budget",
    label: "Budget",
    icon: "💰",
    hint: "How affordable the destination is",
  },
  {
    key: "weather",
    label: "Weather",
    icon: "🌤️",
    hint: "How well the climate matches you",
  },
  {
    key: "community",
    label: "Community",
    icon: "🕌",
    hint: "Bangladeshi community, halal food and mosques",
  },
  {
    key: "safety",
    label: "Safety",
    icon: "🛡️",
    hint: "Day-to-day student safety",
  },
];


function scoreStyle(score) {
  if (score >= 75) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "#10b981",
      label: "Strong match",
    };
  }

  if (score >= 55) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "#f59e0b",
      label: "Moderate match",
    };
  }

  return {
    text: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    ring: "#f43f5e",
    label: "Lower match",
  };
}


function ScoreRing({ score, size = "large" }) {
  const style = scoreStyle(score);

  const dimensions =
    size === "large"
      ? "h-28 w-28"
      : "h-20 w-20";

  const textSize =
    size === "large"
      ? "text-3xl"
      : "text-xl";

  return (
    <div
      className={`relative flex ${dimensions} shrink-0 items-center justify-center rounded-full`}
      style={{
        background: `conic-gradient(${style.ring} ${score * 3.6}deg, #e2e8f0 0deg)`,
      }}
    >
      <div className="absolute inset-[7px] rounded-full bg-white" />

      <div className="relative text-center">
        <p
          className={`${textSize} font-bold tracking-tight ${style.text}`}
        >
          {score}
        </p>

        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          / 100
        </p>
      </div>
    </div>
  );
}


function ComponentBar({
  component,
  score,
  weight,
}) {
  return (
    <div>

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">

          <span className="text-base">
            {component.icon}
          </span>

          <span className="text-xs font-semibold text-slate-600">
            {component.label}
          </span>

        </div>


        <span className="text-xs font-bold text-slate-700">
          {score}
        </span>

      </div>


      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, score)
            )}%`,
          }}
        />

      </div>


      <p className="mt-1.5 text-[10px] text-slate-400">
        Priority weight: {weight}/10
      </p>

    </div>
  );
}


export default function Compatibility() {
  const [weights, setWeights] =
    useState({
      budget: 7,
      weather: 5,
      community: 8,
      safety: 6,
    });

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const compute = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await api(
        "/api/tools/compatibility",
        {
          method: "POST",
          body: {
            weights,
          },
        }
      );

      setData(res);
    } catch (err) {
      setError(
        err.message ||
          "Unable to calculate compatibility scores."
      );
    } finally {
      setLoading(false);
    }
  };


  const totalWeight =
    Object.values(weights).reduce(
      (sum, value) => sum + value,
      0
    );


  const topResult =
    data?.results?.[0];


  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* PAGE HEADER */}

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-8">

        <div className="relative z-10 max-w-3xl">

          <span className="inline-flex rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Destination Fit
          </span>


          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Life Compatibility Score
          </h1>


          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Tell GradBridge what matters most
            to you and compare destinations
            using a transparent weighted-score
            calculation.
          </p>


          <div className="mt-5 flex flex-wrap gap-2">

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              No AI scoring
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              Transparent weights
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
              Ranked destinations
            </span>

          </div>

        </div>


        <div className="pointer-events-none absolute -right-8 -top-10 hidden text-[145px] opacity-[0.06] sm:block">
          🧩
        </div>

      </section>


      {/* MAIN AREA */}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">

        {/* PRIORITY FORM */}

        <form
          onSubmit={compute}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Your Priorities
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                What matters most to you?
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Move each slider from 0 to 10.
                Higher values give that factor
                more influence.
              </p>

            </div>


            <div className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-center">

              <p className="text-lg font-bold text-slate-900">
                {totalWeight}
              </p>

              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                total weight
              </p>

            </div>

          </div>


          <div className="mt-6 space-y-4">

            {COMPONENTS.map(
              (component) => {

                const value =
                  weights[
                    component.key
                  ];

                return (
                  <div
                    key={
                      component.key
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                          {
                            component.icon
                          }
                        </div>


                        <div>

                          <p className="text-sm font-semibold text-slate-800">
                            {
                              component.label
                            }
                          </p>

                          <p className="mt-0.5 text-xs leading-5 text-slate-400">
                            {
                              component.hint
                            }
                          </p>

                        </div>

                      </div>


                      <div className="flex h-9 min-w-12 items-center justify-center rounded-lg bg-indigo-50 px-2 text-sm font-bold text-indigo-700">
                        {value}/10
                      </div>

                    </div>


                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={value}
                      onChange={(e) =>
                        setWeights({
                          ...weights,
                          [component.key]:
                            Number(
                              e.target.value
                            ),
                        })
                      }
                      className="mt-4 w-full cursor-pointer accent-indigo-600"
                    />


                    <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-300">

                      <span>
                        Not important
                      </span>

                      <span>
                        Very important
                      </span>

                    </div>

                  </div>
                );
              }
            )}

          </div>


          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
          >

            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                  />
                </svg>

                Computing ranking...
              </>
            ) : (
              <>
                Rank Destinations
                <span className="ml-2">
                  →
                </span>
              </>
            )}

          </button>


          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">

            <p className="text-xs leading-5 text-slate-400">
              Your scores use a weighted-sum
              formula. Increasing a priority
              makes that category more important
              in the final ranking.
            </p>

          </div>

        </form>


        {/* RIGHT SUMMARY */}

        <div>

          {/* ERROR */}

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">

              <div className="flex gap-3">

                <div className="text-xl">
                  ⚠️
                </div>


                <div>

                  <p className="font-semibold text-rose-800">
                    Unable to rank destinations
                  </p>

                  <p className="mt-1 text-sm leading-6 text-rose-700">
                    {error}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* EMPTY */}

          {!data &&
            !loading && (
              <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  🧩
                </div>


                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  Your best matches will appear here
                </h2>


                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Set your priorities and rank
                  the available destinations to
                  see which places fit your
                  preferences best.
                </p>


                <div className="mt-7 grid w-full max-w-md grid-cols-2 gap-3">

                  {COMPONENTS.map(
                    (component) => (
                      <div
                        key={
                          component.key
                        }
                        className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                      >

                        <span className="text-xl">
                          {
                            component.icon
                          }
                        </span>

                        <p className="mt-2 text-xs font-semibold text-slate-600">
                          {
                            component.label
                          }
                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}


          {/* LOADING */}

          {loading && (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">

                <svg
                  className="h-7 w-7 animate-spin text-indigo-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />

                  <path
                    className="opacity-80"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                  />
                </svg>

              </div>


              <h2 className="mt-5 font-semibold text-slate-900">
                Comparing destinations
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Applying your priority weights
                to each destination...
              </p>

            </div>
          )}


          {/* TOP RESULT */}

          {data &&
            topResult && (
              <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">

                <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white">

                  <div className="flex flex-wrap items-center justify-between gap-5">

                    <div>

                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.13em] text-indigo-50">
                        Best Match
                      </span>


                      <h2 className="mt-4 text-2xl font-bold tracking-tight">
                        {topResult.city}
                      </h2>

                      <p className="mt-1 text-sm text-indigo-100">
                        {
                          topResult.country
                        }
                      </p>


                      <p className="mt-4 max-w-md text-sm leading-6 text-indigo-100">
                        {
                          topResult.verdict
                        }
                      </p>

                    </div>


                    <div className="rounded-full bg-white p-1 shadow-xl shadow-indigo-900/20">

                      <ScoreRing
                        score={
                          topResult.score
                        }
                        size="large"
                      />

                    </div>

                  </div>

                </div>


                <div className="p-5 sm:p-6">

                  <div className="flex items-center justify-between gap-3">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                        Match Breakdown
                      </p>

                      <h3 className="mt-1 font-semibold text-slate-900">
                        Why this destination ranks first
                      </h3>

                    </div>

                  </div>


                  <div className="mt-5 grid gap-4 sm:grid-cols-2">

                    {COMPONENTS.map(
                      (
                        component
                      ) => (
                        <ComponentBar
                          key={
                            component.key
                          }
                          component={
                            component
                          }
                          score={
                            topResult
                              .components[
                              component
                                .key
                            ]
                          }
                          weight={
                            weights[
                              component
                                .key
                            ]
                          }
                        />
                      )
                    )}

                  </div>

                </div>

              </div>
            )}

        </div>

      </section>


      {/* WEATHER NOTE */}

      {data?.weatherPreference ===
        "no-preference" &&
        weights.weather > 0 && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

            <div className="flex items-start gap-3">

              <span>
                💡
              </span>

              <p className="text-xs leading-5 text-slate-500">
                You haven&apos;t set a weather
                preference in your Profile, so
                weather is scored neutrally for
                every destination. Add a weather
                preference to make this category
                more meaningful.
              </p>

            </div>

          </section>
        )}


      {/* ALL RANKINGS */}

      {data?.results?.length >
        0 && (
        <section className="mt-8">

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Full Ranking
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Destination comparison
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ranked from highest to lowest
                compatibility score.
              </p>

            </div>


            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
              {data.results.length}{" "}
              {data.results.length ===
              1
                ? "destination"
                : "destinations"}
            </span>

          </div>


          <div className="space-y-4">

            {data.results.map(
              (result, index) => {

                const style =
                  scoreStyle(
                    result.score
                  );

                return (
                  <article
                    key={`${result.city}-${result.country}`}
                    className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60 ${
                      index === 0
                        ? "border-indigo-200"
                        : "border-slate-200"
                    }`}
                  >

                    <div className="p-5 sm:p-6">

                      <div className="flex flex-col gap-5 md:flex-row md:items-center">

                        {/* RANK */}

                        <div className="flex items-center gap-4 md:w-[230px] md:shrink-0">

                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              index ===
                              0
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            #
                            {index +
                              1}
                          </div>


                          <div className="min-w-0">

                            <h3 className="truncate font-semibold text-slate-900">
                              {
                                result.city
                              }
                            </h3>

                            <p className="mt-0.5 text-sm text-slate-400">
                              {
                                result.country
                              }
                            </p>

                          </div>

                        </div>


                        {/* COMPONENTS */}

                        <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-4 lg:grid-cols-4">

                          {COMPONENTS.map(
                            (
                              component
                            ) => (
                              <ComponentBar
                                key={
                                  component.key
                                }
                                component={
                                  component
                                }
                                score={
                                  result
                                    .components[
                                    component
                                      .key
                                  ]
                                }
                                weight={
                                  weights[
                                    component
                                      .key
                                  ]
                                }
                              />
                            )
                          )}

                        </div>


                        {/* SCORE */}

                        <div className="flex shrink-0 items-center gap-4 border-t border-slate-100 pt-4 md:w-[170px] md:justify-end md:border-l md:border-t-0 md:pl-5 md:pt-0">

                          <div className="text-right">

                            <p
                              className={`text-2xl font-bold ${style.text}`}
                            >
                              {
                                result.score
                              }
                            </p>

                            <p className="text-xs text-slate-400">
                              out of 100
                            </p>


                            <span
                              className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${style.bg} ${style.border} ${style.text}`}
                            >
                              {
                                style.label
                              }
                            </span>

                          </div>

                        </div>

                      </div>


                      <div className="mt-5 border-t border-slate-100 pt-4">

                        <p className="text-sm leading-6 text-slate-600">
                          {
                            result.verdict
                          }
                        </p>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        </section>
      )}


      {/* EXPLANATION */}

      <section className="mt-6 rounded-xl bg-slate-100/70 px-4 py-3">

        <p className="text-xs leading-5 text-slate-500">
          Compatibility scores are calculated
          from your selected priority weights
          and destination component scores.
          They are intended to support
          comparison rather than make a final
          study-abroad decision for you.
        </p>

      </section>

    </main>
  );
}