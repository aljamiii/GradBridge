import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-xl border border-white/70 bg-white/60 backdrop-blur-sm px-3.5 py-2.5 text-ink-900 placeholder-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

const usd = (n) => `$${Number(n).toLocaleString()}`;
const bdt = (n) => `৳${Number(n).toLocaleString()}`;

const RISK_STYLES = {
  safe: { style: "bg-green-50 border-green-200 text-green-800", emoji: "✅", label: "Fully funded" },
  low: { style: "bg-lime-50 border-lime-200 text-lime-800", emoji: "🙂", label: "Low risk" },
  medium: { style: "bg-amber-50 border-amber-200 text-amber-800", emoji: "⚠️", label: "Medium risk" },
  high: { style: "bg-red-50 border-red-200 text-red-800", emoji: "🚨", label: "High risk" },
};

export default function FinancialRisk() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const predictedCost = searchParams.get("cost") ?? "";
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const [form, setForm] = useState({
    totalCostUSD: predictedCost,
    fundingUSD: user.studentProfile?.budgetUSD ?? "",
    scholarshipUSD: "",
    deadline: nextYear.toISOString().slice(0, 10),
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const analyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setData(await api("/api/tools/financial-risk", { method: "POST", body: form }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const risk = data && RISK_STYLES[data.risk];

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Financial Risk & Savings Planner</h1>
      <p className="mt-1 text-ink-500">
        Cost vs. funding, honestly — the gap, the risk, and exactly what to save
        each month. Get your cost estimate from the{" "}
        <Link to="/cost-predictor" className="text-brand-600 hover:underline">Cost Predictor</Link> first.
      </p>

      <form onSubmit={analyze}
        className="mt-6 glass-card rounded-2xl p-6 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">
              Estimated first-year cost (USD) *
            </span>
            <input name="totalCostUSD" type="number" min="1" required value={form.totalCostUSD}
              onChange={set} placeholder="39325" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">
              Your funding — savings + family (USD)
            </span>
            <input name="fundingUSD" type="number" min="0" value={form.fundingUSD}
              onChange={set} placeholder="15000" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">
              Confirmed scholarship (USD)
            </span>
            <input name="scholarshipUSD" type="number" min="0" value={form.scholarshipUSD}
              onChange={set} placeholder="0" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">
              Departure / payment deadline
            </span>
            <input name="deadline" type="date" value={form.deadline}
              onChange={set} className={inputClass} />
          </label>
        </div>
        <button type="submit" disabled={loading}
          className="mt-5 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Calculating…" : "Analyze my risk"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="mt-6 space-y-4">
          {/* Risk verdict */}
          <div className={`rounded-xl border p-5 ${risk.style}`}>
            <h2 className="text-lg font-bold">{risk.emoji} {risk.label}</h2>
            <p className="mt-1 text-sm">{data.riskMessage}</p>
          </div>

          {/* The numbers */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm text-ink-500">Funding gap</p>
              <p className="mt-1 text-2xl font-bold text-ink-900">{usd(data.shortfallUSD)}</p>
              {data.shortfallBDT != null && (
                <p className="text-sm text-ink-500">≈ {bdt(data.shortfallBDT)}</p>
              )}
              <p className="mt-1 text-xs text-ink-400">{data.shortfallPercent}% of total cost</p>
            </div>
            <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm text-ink-500">Scholarship coverage</p>
              <p className="mt-1 text-2xl font-bold text-ink-900">{data.scholarshipCoveragePercent}%</p>
              <p className="mt-1 text-xs text-ink-400">of the total cost</p>
            </div>
            <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
              <p className="text-sm text-ink-500">Save monthly</p>
              {data.monthlySavingsUSD != null ? (
                <>
                  <p className="mt-1 text-2xl font-bold text-ink-900">{usd(data.monthlySavingsUSD)}</p>
                  {data.monthlySavingsBDT != null && (
                    <p className="text-sm text-ink-500">≈ {bdt(data.monthlySavingsBDT)}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-400">
                    for {data.monthsLeft} month{data.monthsLeft !== 1 && "s"} until your deadline
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-400">Set a deadline to see this</p>
              )}
            </div>
          </div>

          {data.usdToBdt && (
            <p className="text-xs text-ink-400">
              Live rate: 1 USD ≈ {data.usdToBdt.toFixed(1)} BDT (open.er-api.com)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
