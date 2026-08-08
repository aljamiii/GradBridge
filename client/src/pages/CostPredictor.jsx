import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";


const inputClass =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";


const usd = (n) =>
  `$${Number(n).toLocaleString()}`;

const bdt = (n) =>
  `৳${Number(n).toLocaleString()}`;


const LIFESTYLES = [
  {
    value: "frugal",
    label: "Frugal",
    icon: "🪙",
    hint: "Shared room, cook at home",
  },
  {
    value: "moderate",
    label: "Moderate",
    icon: "⚖️",
    hint: "Balanced everyday spending",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    icon: "✨",
    hint: "Own place, more dining out",
  },
];


export default function CostPredictor() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    country:
      user.studentProfile?.preferredCountry ?? "",
    city: "",
    lifestyle: "moderate",
  });

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const budget =
    user.studentProfile?.budgetUSD;


  const predict = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await api(
        "/api/ai/cost-predictor",
        {
          method: "POST",
          body: form,
        }
      );

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to calculate your estimated costs."
      );
    } finally {
      setLoading(false);
    }
  };


  const rows =
    result && [
      [
        "Tuition",
        "1 academic year",
        result.breakdownUSD
          .tuitionPerYear,
        "🎓",
      ],
      [
        "Visa & permits",
        "Application and permit costs",
        result.breakdownUSD
          .visaFees,
        "🛂",
      ],
      [
        "Flight",
        "Estimated one-way airfare",
        result.breakdownUSD
          .flightOneWay,
        "✈️",
      ],
      [
        "Health insurance",
        "1 year of coverage",
        result.breakdownUSD
          .healthInsurancePerYear,
        "🏥",
      ],
      [
        "Housing deposit",
        "Initial accommodation deposit",
        result.breakdownUSD
          .housingDeposit,
        "🏠",
      ],
      [
        "Living expenses",
        `${usd(
          result.breakdownUSD
            .monthlyLiving
        )}/month × 12`,
        result.breakdownUSD
          .yearlyLiving,
        "🛒",
      ],
    ];


  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* PAGE HEADER */}

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-8">

        <div className="relative z-10 max-w-3xl">

          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Financial Planning
          </span>


          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            AI Cost Predictor
          </h1>


          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Estimate your first-year
            study-abroad expenses using your
            destination and lifestyle, with
            live exchange-rate information.
          </p>

        </div>


        <div className="pointer-events-none absolute -right-8 -top-12 hidden text-[145px] opacity-[0.06] sm:block">
          💰
        </div>

      </section>


      {/* MAIN TWO-COLUMN AREA */}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">

        {/* LEFT — INPUTS */}

        <form
          onSubmit={predict}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">
              📍
            </div>


            <div>

              <h2 className="font-semibold text-slate-900">
                Your study plan
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Tell us where you plan to study
                and how you expect to live.
              </p>

            </div>

          </div>


          {/* COUNTRY */}

          <div className="mt-6">

            <label
              htmlFor="cost-country"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Target country
              <span className="ml-1 text-rose-500">
                *
              </span>
            </label>


            <input
              id="cost-country"
              value={form.country}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  country:
                    e.target.value,
                })
              }
              placeholder="e.g. Canada"
              className={inputClass}
            />

          </div>


          {/* CITY */}

          <div className="mt-4">

            <label
              htmlFor="cost-city"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              City
              <span className="ml-1 font-normal text-slate-400">
                optional
              </span>
            </label>


            <input
              id="cost-city"
              value={form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  city:
                    e.target.value,
                })
              }
              placeholder="e.g. Toronto"
              className={inputClass}
            />


            <p className="mt-2 text-xs text-slate-400">
              Adding a city can improve the
              living-cost estimate.
            </p>

          </div>


          {/* LIFESTYLE */}

          <div className="mt-6">

            <div className="mb-3">

              <p className="text-sm font-semibold text-slate-700">
                Lifestyle
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Choose the option closest to
                your expected spending habits.
              </p>

            </div>


            <div className="space-y-2">

              {LIFESTYLES.map(
                (lifestyle) => {
                  const selected =
                    form.lifestyle ===
                    lifestyle.value;

                  return (
                    <button
                      type="button"
                      key={
                        lifestyle.value
                      }
                      onClick={() =>
                        setForm({
                          ...form,
                          lifestyle:
                            lifestyle.value,
                        })
                      }
                      className={`group flex w-full items-center gap-4 rounded-xl border p-3.5 text-left transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-50"
                          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                    >

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                          selected
                            ? "bg-white shadow-sm"
                            : "bg-slate-100"
                        }`}
                      >
                        {
                          lifestyle.icon
                        }
                      </div>


                      <div className="min-w-0 flex-1">

                        <p
                          className={`text-sm font-semibold ${
                            selected
                              ? "text-indigo-700"
                              : "text-slate-800"
                          }`}
                        >
                          {
                            lifestyle.label
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            lifestyle.hint
                          }
                        </p>

                      </div>


                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          selected
                            ? "border-indigo-600 bg-indigo-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >

                        {selected && (
                          <span className="text-[10px] font-bold text-white">
                            ✓
                          </span>
                        )}

                      </div>

                    </button>
                  );
                }
              )}

            </div>

          </div>


          {/* CURRENT PROFILE BUDGET */}

          {budget != null && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                Profile budget
              </p>

              <div className="mt-2 flex items-end justify-between gap-3">

                <div>
                  <p className="text-xl font-bold text-slate-900">
                    {usd(budget)}
                  </p>

                  <p className="text-xs text-slate-400">
                    per year
                  </p>
                </div>


                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm">
                  From profile
                </span>

              </div>

            </div>
          )}


          {/* SUBMIT */}

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

                Calculating...
              </>
            ) : (
              <>
                Calculate first-year cost
                <span className="ml-2">
                  →
                </span>
              </>
            )}

          </button>

        </form>


        {/* RIGHT SIDE */}

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
                    Unable to calculate costs
                  </p>

                  <p className="mt-1 text-sm leading-6 text-rose-700">
                    {error}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* EMPTY STATE */}

          {!result &&
            !loading && (
              <div className="flex min-h-[470px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  💳
                </div>


                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  Your estimate will appear here
                </h2>


                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Enter your destination,
                  choose a lifestyle, and run
                  the predictor to see your
                  estimated first-year cost.
                </p>


                <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2">

                  <div className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="text-lg">
                      🎓
                    </div>

                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Tuition
                    </p>
                  </div>


                  <div className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="text-lg">
                      🏠
                    </div>

                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Living
                    </p>
                  </div>


                  <div className="rounded-xl bg-slate-50 px-3 py-3">
                    <div className="text-lg">
                      ✈️
                    </div>

                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Travel
                    </p>
                  </div>

                </div>

              </div>
            )}


          {/* LOADING STATE */}

          {loading && (
            <div className="flex min-h-[470px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

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
                Building your estimate
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Calculating destination and
                lifestyle costs...
              </p>

            </div>
          )}


          {/* RESULT */}

          {result && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* TOTAL */}

              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 text-white sm:p-7">

                <div className="relative z-10">

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-200">
                        Estimated first-year cost
                      </p>


                      <h2 className="mt-2 text-lg font-semibold text-white">
                        {result.input.city
                          ? `${result.input.city}, `
                          : ""}
                        {
                          result.input
                            .country
                        }
                      </h2>

                    </div>


                    {result.cached && (
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur">
                        ⚡ Cached result
                      </span>
                    )}

                  </div>


                  <div className="mt-7">

                    <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                      {usd(
                        result.totalUSD
                      )}
                    </p>


                    {result.totalBDT && (
                      <p className="mt-2 text-base font-medium text-slate-300">
                        ≈{" "}
                        {bdt(
                          result.totalBDT
                        )}
                      </p>
                    )}

                  </div>


                  <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300">
                    Estimated total for tuition,
                    living costs, travel,
                    insurance, and other common
                    first-year expenses.
                  </p>

                </div>


                <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-indigo-500/10" />

              </div>


              {/* BUDGET COMPARISON */}

              {budget != null && (
                <div className="border-b border-slate-100 p-5">

                  {budget >=
                  result.totalUSD ? (

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                          ✅
                        </div>


                        <div>

                          <p className="font-semibold text-emerald-800">
                            Your budget covers this estimate
                          </p>

                          <p className="mt-1 text-sm leading-6 text-emerald-700">
                            Your annual budget
                            of{" "}
                            <strong>
                              {usd(
                                budget
                              )}
                            </strong>{" "}
                            is enough for this
                            estimated first-year
                            cost.
                          </p>

                        </div>

                      </div>

                    </div>

                  ) : (

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                          ⚠️
                        </div>


                        <div>

                          <p className="font-semibold text-amber-800">
                            Estimated funding gap
                          </p>

                          <p className="mt-1 text-sm leading-6 text-amber-700">
                            Your annual budget
                            of{" "}
                            <strong>
                              {usd(
                                budget
                              )}
                            </strong>{" "}
                            is approximately{" "}
                            <strong>
                              {usd(
                                result.totalUSD -
                                  budget
                              )}
                            </strong>{" "}
                            below this estimate.
                          </p>

                        </div>

                      </div>

                    </div>

                  )}

                </div>
              )}


              {/* BREAKDOWN */}

              <div className="p-5 sm:p-6">

                <div className="flex items-end justify-between gap-4">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                      Cost breakdown
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Where your money may go
                    </h3>

                  </div>

                </div>


                <div className="mt-5 divide-y divide-slate-100">

                  {rows.map(
                    ([
                      label,
                      detail,
                      amount,
                      icon,
                    ]) => (

                      <div
                        key={
                          label
                        }
                        className="flex items-center gap-3 py-3.5"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg">
                          {
                            icon
                          }
                        </div>


                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-medium text-slate-800">
                            {
                              label
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {
                              detail
                            }
                          </p>

                        </div>


                        <p className="shrink-0 text-sm font-semibold text-slate-900">
                          {usd(
                            amount
                          )}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </div>


              {/* EXCHANGE RATE */}

              <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">

                <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                  <span>
                    1 USD ≈{" "}
                    {result.exchange
                      .usdToBdt
                      ?.toFixed(1)}{" "}
                    BDT
                  </span>


                  {result.exchange
                    .usdToLocal && (
                    <span>
                      1 USD ≈{" "}
                      {result.exchange.usdToLocal.toFixed(
                        2
                      )}{" "}
                      {
                        result.exchange
                          .currencyLocal
                      }
                    </span>
                  )}

                </div>


                <p className="mt-1 text-[11px] text-slate-400">
                  Exchange-rate source:{" "}
                  {
                    result.exchange
                      .source
                  }
                </p>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* MONEY TIPS */}

      {result?.notes?.length >
        0 && (
        <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:p-6">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              💡
            </div>


            <div className="flex-1">

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Money tips
              </p>

              <h2 className="mt-1 font-semibold text-slate-900">
                Ways to plan more effectively
              </h2>


              <ul className="mt-4 grid gap-3 md:grid-cols-2">

                {result.notes.map(
                  (note) => (

                    <li
                      key={
                        note
                      }
                      className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-white p-4 text-sm leading-6 text-slate-600"
                    >

                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />

                      {
                        note
                      }

                    </li>

                  )
                )}

              </ul>

            </div>

          </div>

        </section>
      )}


      {/* DISCLAIMER */}

      <div className="mt-5 rounded-xl bg-slate-100/70 px-4 py-3">

        <p className="text-xs leading-5 text-slate-500">
          AI estimates are indicative and may
          vary by institution, city, lifestyle,
          and exchange-rate movement. Always
          verify tuition and official fees on
          the university&apos;s website.
        </p>

      </div>

    </main>
  );
}