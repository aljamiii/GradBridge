import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";


const inputClass =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";


const usd = (n) =>
  `$${Number(n).toLocaleString()}`;

const bdt = (n) =>
  `৳${Number(n).toLocaleString()}`;


const RISK_STYLES = {
  safe: {
    label: "Fully funded",
    icon: "✓",
    panel:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconStyle:
      "bg-emerald-100 text-emerald-700",
  },

  low: {
    label: "Low risk",
    icon: "✓",
    panel:
      "border-lime-200 bg-gradient-to-br from-lime-50 to-white",
    badge:
      "border-lime-200 bg-lime-50 text-lime-700",
    iconStyle:
      "bg-lime-100 text-lime-700",
  },

  medium: {
    label: "Medium risk",
    icon: "!",
    panel:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700",
    iconStyle:
      "bg-amber-100 text-amber-700",
  },

  high: {
    label: "High risk",
    icon: "!",
    panel:
      "border-rose-200 bg-gradient-to-br from-rose-50 to-white",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700",
    iconStyle:
      "bg-rose-100 text-rose-700",
  },
};


export default function FinancialRisk() {
  const { user } = useAuth();


  const nextYear = new Date();
  nextYear.setFullYear(
    nextYear.getFullYear() + 1
  );


  const [form, setForm] = useState({
    totalCostUSD: "",
    fundingUSD:
      user.studentProfile?.budgetUSD ?? "",
    scholarshipUSD: "",
    deadline:
      nextYear
        .toISOString()
        .slice(0, 10),
  });


  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  const set = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };


  const analyze = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await api(
        "/api/tools/financial-risk",
        {
          method: "POST",
          body: form,
        }
      );

      setData(result);
    } catch (err) {
      setError(
        err.message ||
          "Unable to analyze your financial risk."
      );
    } finally {
      setLoading(false);
    }
  };


  const risk =
    data &&
    (RISK_STYLES[data.risk] ??
      RISK_STYLES.medium);


  const totalFunding =
    Number(form.fundingUSD || 0) +
    Number(form.scholarshipUSD || 0);


  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* PAGE HEADER */}

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-8">

        <div className="relative z-10 max-w-3xl">

          <span className="inline-flex rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Financial Readiness
          </span>


          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Financial Risk & Savings Planner
          </h1>


          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Compare your estimated study cost
            against your available funding,
            identify a possible shortfall, and
            see how much you may need to save
            before departure.
          </p>


          <Link
            to="/cost-predictor"
            className="mt-5 inline-flex items-center rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            💰 Get a cost estimate first
            <span className="ml-2">
              →
            </span>
          </Link>

        </div>


        <div className="pointer-events-none absolute -right-8 -top-12 hidden text-[145px] opacity-[0.06] sm:block">
          📉
        </div>

      </section>


      {/* MAIN AREA */}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">

        {/* FORM */}

        <form
          onSubmit={analyze}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Your Numbers
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Build your funding picture
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Enter your expected cost,
              available funding, scholarship,
              and target deadline.
            </p>

          </div>


          {/* TOTAL COST */}

          <div className="mt-6">

            <label
              htmlFor="risk-total-cost"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Estimated first-year cost
              <span className="ml-1 text-rose-500">
                *
              </span>
            </label>


            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                $
              </span>

              <input
                id="risk-total-cost"
                name="totalCostUSD"
                type="number"
                min="1"
                required
                value={
                  form.totalCostUSD
                }
                onChange={set}
                placeholder="39325"
                className={`${inputClass} pl-8`}
              />

            </div>


            <p className="mt-2 text-xs text-slate-400">
              Use the result from Cost
              Predictor if you already ran it.
            </p>

          </div>


          {/* FUNDING */}

          <div className="mt-5">

            <label
              htmlFor="risk-funding"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Savings + family funding
            </label>


            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                $
              </span>

              <input
                id="risk-funding"
                name="fundingUSD"
                type="number"
                min="0"
                value={
                  form.fundingUSD
                }
                onChange={set}
                placeholder="15000"
                className={`${inputClass} pl-8`}
              />

            </div>


            {user.studentProfile?.budgetUSD !=
              null && (
              <p className="mt-2 text-xs text-slate-400">
                Pre-filled using the budget
                from your profile.
              </p>
            )}

          </div>


          {/* SCHOLARSHIP */}

          <div className="mt-5">

            <label
              htmlFor="risk-scholarship"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Confirmed scholarship
            </label>


            <div className="relative">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                $
              </span>

              <input
                id="risk-scholarship"
                name="scholarshipUSD"
                type="number"
                min="0"
                value={
                  form.scholarshipUSD
                }
                onChange={set}
                placeholder="0"
                className={`${inputClass} pl-8`}
              />

            </div>


            <p className="mt-2 text-xs text-slate-400">
              Only include funding that is
              already confirmed.
            </p>

          </div>


          {/* DEADLINE */}

          <div className="mt-5">

            <label
              htmlFor="risk-deadline"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Departure / payment deadline
            </label>


            <input
              id="risk-deadline"
              name="deadline"
              type="date"
              value={
                form.deadline
              }
              onChange={set}
              className={inputClass}
            />

          </div>


          {/* FUNDING SUMMARY */}

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">

            <div className="flex items-center justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-400">
                  Current funding entered
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {usd(
                    totalFunding
                  )}
                </p>

              </div>


              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                💵
              </div>

            </div>

          </div>


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
                Analyze My Risk
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
                    Analysis failed
                  </p>

                  <p className="mt-1 text-sm leading-6 text-rose-700">
                    {error}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* EMPTY STATE */}

          {!data &&
            !loading && (
              <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  📊
                </div>


                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  Your financial analysis will appear here
                </h2>


                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Add your estimated cost and
                  available funding to see your
                  risk level, shortfall, and
                  monthly savings target.
                </p>


                <div className="mt-7 grid w-full max-w-md grid-cols-3 gap-2">

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xl">
                      💵
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      Funding gap
                    </p>
                  </div>


                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xl">
                      🎁
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      Scholarships
                    </p>
                  </div>


                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xl">
                      📅
                    </div>

                    <p className="mt-2 text-[11px] font-medium text-slate-500">
                      Monthly target
                    </p>
                  </div>

                </div>

              </div>
            )}


          {/* LOADING */}

          {loading && (
            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

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
                Reviewing your finances
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Calculating your funding gap
                and savings requirements...
              </p>

            </div>
          )}


          {/* RESULT */}

          {data && (
            <div className="space-y-4">

              {/* RISK VERDICT */}

              <div
                className={`rounded-2xl border p-6 shadow-sm ${risk.panel}`}
              >

                <div className="flex items-start gap-4">

                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${risk.iconStyle}`}
                  >
                    {risk.icon}
                  </div>


                  <div className="min-w-0 flex-1">

                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Financial risk assessment
                    </p>


                    <div className="mt-2 flex flex-wrap items-center gap-3">

                      <h2 className="text-2xl font-bold text-slate-900">
                        {risk.label}
                      </h2>


                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${risk.badge}`}
                      >
                        {data.risk} risk
                      </span>

                    </div>


                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {
                        data.riskMessage
                      }
                    </p>

                  </div>

                </div>

              </div>


              {/* MAIN NUMBERS */}

              <div className="grid gap-4 sm:grid-cols-3">

                {/* GAP */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-lg">
                      📉
                    </div>

                    <span className="text-xs font-semibold text-slate-400">
                      {
                        data.shortfallPercent
                      }
                      %
                    </span>

                  </div>


                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Funding gap
                  </p>


                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {usd(
                      data.shortfallUSD
                    )}
                  </p>


                  {data.shortfallBDT !=
                    null && (
                    <p className="mt-1 text-sm text-slate-500">
                      ≈{" "}
                      {bdt(
                        data.shortfallBDT
                      )}
                    </p>
                  )}


                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    {
                      data.shortfallPercent
                    }
                    % of your total estimated
                    cost.
                  </p>

                </div>


                {/* SCHOLARSHIP */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                    🎁
                  </div>


                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Scholarship coverage
                  </p>


                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                    {
                      data.scholarshipCoveragePercent
                    }
                    %
                  </p>


                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Portion of your estimated
                    total covered by confirmed
                    scholarship funding.
                  </p>

                </div>


                {/* MONTHLY */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg">
                    📅
                  </div>


                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Monthly savings
                  </p>


                  {data.monthlySavingsUSD !=
                  null ? (
                    <>
                      <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-700">
                        {usd(
                          data.monthlySavingsUSD
                        )}
                      </p>


                      {data.monthlySavingsBDT !=
                        null && (
                        <p className="mt-1 text-sm text-slate-500">
                          ≈{" "}
                          {bdt(
                            data.monthlySavingsBDT
                          )}
                        </p>
                      )}


                      <p className="mt-3 text-xs leading-5 text-slate-400">
                        For{" "}
                        {
                          data.monthsLeft
                        }{" "}
                        month
                        {data.monthsLeft !==
                          1 &&
                          "s"}{" "}
                        until your deadline.
                      </p>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      Set a deadline to see
                      your monthly target.
                    </p>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* SAVINGS PLAN */}

      {data?.monthlySavingsUSD !=
        null &&
        data.shortfallUSD > 0 && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">

            <div className="grid lg:grid-cols-[1fr_.65fr]">

              <div className="p-5 sm:p-6">

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                  Savings Plan
                </p>


                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  A simple target before your deadline
                </h2>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  To close the current funding
                  gap by your selected deadline,
                  you would need to save
                  approximately the following
                  amount each month.
                </p>


                <div className="mt-5 flex flex-wrap items-baseline gap-2">

                  <span className="text-4xl font-bold tracking-tight text-indigo-700">
                    {usd(
                      data.monthlySavingsUSD
                    )}
                  </span>

                  <span className="text-sm text-slate-400">
                    / month
                  </span>

                </div>


                {data.monthlySavingsBDT !=
                  null && (
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    ≈{" "}
                    {bdt(
                      data.monthlySavingsBDT
                    )}{" "}
                    per month
                  </p>
                )}

              </div>


              <div className="flex items-center justify-center bg-indigo-50 p-6">

                <div className="text-center">

                  <p className="text-4xl font-bold text-indigo-700">
                    {
                      data.monthsLeft
                    }
                  </p>

                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.13em] text-indigo-500">
                    Month
                    {data.monthsLeft !==
                      1 &&
                      "s"}{" "}
                    remaining
                  </p>

                </div>

              </div>

            </div>

          </section>
        )}


      {/* FULLY FUNDED */}

      {data &&
        data.shortfallUSD === 0 && (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                🎉
              </div>


              <div>

                <p className="font-semibold text-emerald-800">
                  No funding gap detected
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Based on the numbers you
                  entered, your available
                  funding and confirmed
                  scholarship cover the
                  estimated cost.
                </p>

              </div>

            </div>

          </section>
        )}


      {/* EXCHANGE */}

      {data?.usdToBdt && (
        <section className="mt-5 rounded-xl bg-slate-100/70 px-4 py-3">

          <p className="text-xs leading-5 text-slate-500">
            Exchange reference: 1 USD ≈{" "}
            {data.usdToBdt.toFixed(1)} BDT.
            Exchange rates change over time,
            so BDT values are approximate.
          </p>

        </section>
      )}


      {/* DISCLAIMER */}

      <section className="mt-3 rounded-xl bg-slate-100/70 px-4 py-3">

        <p className="text-xs leading-5 text-slate-500">
          This planner is intended for
          budgeting support. Actual tuition,
          living expenses, scholarships, and
          exchange rates may change before
          your departure.
        </p>

      </section>

    </main>
  );
}