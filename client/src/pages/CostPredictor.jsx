import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none";

const usd = (n) => `$${Number(n).toLocaleString()}`;
const bdt = (n) => `৳${Number(n).toLocaleString()}`;

const LIFESTYLES = [
  { value: "frugal", label: "🪙 Frugal", hint: "shared room, cook at home" },
  { value: "moderate", label: "⚖️ Moderate", hint: "balanced spending" },
  { value: "comfortable", label: "✨ Comfortable", hint: "own place, eat out" },
];

export default function CostPredictor() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    country: user.studentProfile?.preferredCountry ?? "",
    city: "",
    lifestyle: "moderate",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const budget = user.studentProfile?.budgetUSD;

  const predict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api("/api/ai/cost-predictor", { method: "POST", body: form });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rows = result && [
    ["Tuition (1 year)", result.breakdownUSD.tuitionPerYear],
    ["Visa & permits", result.breakdownUSD.visaFees],
    ["Flight (one-way)", result.breakdownUSD.flightOneWay],
    ["Health insurance (1 year)", result.breakdownUSD.healthInsurancePerYear],
    ["Housing deposit", result.breakdownUSD.housingDeposit],
    [`Living costs (${usd(result.breakdownUSD.monthlyLiving)}/mo × 12)`, result.breakdownUSD.yearlyLiving],
  ];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800">💰 AI Cost Predictor</h1>
      <p className="mt-1 text-slate-500">
        A realistic first-year budget for your destination — powered by AI and
        live exchange rates.
      </p>

      {/* Input form */}
      <form onSubmit={predict}
        className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Target country *</span>
            <input value={form.country} required
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="Canada" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">City (optional)</span>
            <input value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Toronto" className={inputClass} />
          </label>
        </div>

        <span className="mb-2 mt-4 block text-sm font-medium text-slate-600">Lifestyle</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {LIFESTYLES.map((l) => (
            <button type="button" key={l.value}
              onClick={() => setForm({ ...form, lifestyle: l.value })}
              className={`rounded-lg border px-3 py-2 text-left ${
                form.lifestyle === l.value
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-300 hover:bg-slate-50"
              }`}>
              <span className="block text-sm font-medium text-slate-800">{l.label}</span>
              <span className="block text-xs text-slate-500">{l.hint}</span>
            </button>
          ))}
        </div>

        <button type="submit" disabled={loading}
          className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "🤖 Calculating…" : "Predict my costs"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800">
              First year in {result.input.city ? `${result.input.city}, ` : ""}
              {result.input.country}
            </h2>
            {result.cached && (
              <span className="text-xs text-slate-400">⚡ served from cache</span>
            )}
          </div>

          <table className="mt-4 w-full text-sm">
            <tbody>
              {rows.map(([label, amount]) => (
                <tr key={label} className="border-b border-slate-100">
                  <td className="py-2 text-slate-600">{label}</td>
                  <td className="py-2 text-right font-medium text-slate-800">{usd(amount)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-3 font-semibold text-slate-800">Total (first year)</td>
                <td className="py-3 text-right">
                  <span className="block text-lg font-bold text-indigo-600">{usd(result.totalUSD)}</span>
                  {result.totalBDT && (
                    <span className="block text-sm text-slate-500">≈ {bdt(result.totalBDT)}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Budget comparison — uses the profile they filled in Phase 2b */}
          {budget != null && (
            <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
              budget >= result.totalUSD
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}>
              {budget >= result.totalUSD
                ? `✅ Your budget (${usd(budget)}/yr) covers this estimate.`
                : `⚠️ Your budget (${usd(budget)}/yr) is ${usd(result.totalUSD - budget)} short of this estimate — consider scholarships or a more frugal setup.`}
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Exchange: 1 USD ≈ {result.exchange.usdToBdt?.toFixed(1)} BDT
            {result.exchange.usdToLocal &&
              ` · ≈ ${result.exchange.usdToLocal.toFixed(2)} ${result.exchange.currencyLocal}`}{" "}
            ({result.exchange.source})
          </p>

          {result.notes?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                💡 Money tips
              </h3>
              <ul className="mt-2 space-y-1.5">
                {result.notes.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            AI estimates are indicative — always verify tuition on the university&apos;s website.
          </p>
        </div>
      )}
    </div>
  );
}
