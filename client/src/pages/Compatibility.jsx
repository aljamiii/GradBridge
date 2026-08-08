import { useState } from "react";
import { api } from "../lib/api";

const COMPONENTS = [
  { key: "budget", label: "💰 Budget", hint: "how affordable it is" },
  { key: "weather", label: "🌤 Weather", hint: "matches your climate preference" },
  { key: "community", label: "🕌 Community", hint: "Bangladeshis, halal, mosques" },
  { key: "safety", label: "🛡 Safety", hint: "day-to-day student safety" },
];

const BAR_COLORS = {
  budget: "#4f46e5",
  weather: "#4f46e5",
  community: "#4f46e5",
  safety: "#4f46e5",
};

function ScoreRing({ score }) {
  const color = score >= 75 ? "text-green-600" : score >= 55 ? "text-amber-600" : "text-ink-500";
  return <span className={`text-2xl font-bold ${color}`}>{score}</span>;
}

export default function Compatibility() {
  const [weights, setWeights] = useState({ budget: 7, weather: 5, community: 8, safety: 6 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const compute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/tools/compatibility", { method: "POST", body: { weights } });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Life Compatibility Score</h1>
      <p className="mt-1 text-ink-500">
        Tell us what matters to you — we rank destinations with a transparent
        weighted-sum formula. No AI, just math you can check.
      </p>

      {/* Priority sliders */}
      <form onSubmit={compute}
        className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="grid gap-5 sm:grid-cols-2">
          {COMPONENTS.map((c) => (
            <label key={c.key} className="block">
              <span className="flex justify-between text-sm">
                <span className="font-medium text-ink-700">{c.label}</span>
                <span className="font-bold text-brand-600">{weights[c.key]}/10</span>
              </span>
              <input type="range" min={0} max={10} value={weights[c.key]}
                onChange={(e) => setWeights({ ...weights, [c.key]: Number(e.target.value) })}
                className="mt-1 w-full accent-brand-600" />
              <span className="text-xs text-ink-400">{c.hint}</span>
            </label>
          ))}
        </div>
        <button type="submit" disabled={loading}
          className="mt-5 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Computing…" : "Rank destinations for me"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Ranked results */}
      {data && (
        <div className="mt-6 space-y-3">
          {data.weatherPreference === "no-preference" && weights.weather > 0 && (
            <p className="rounded-lg bg-slate-100 px-4 py-2 text-xs text-ink-500">
              💡 You haven&apos;t set a weather preference in your Profile, so weather
              scores neutral for every city.
            </p>
          )}
          {data.results.map((r, i) => (
            <div key={r.city} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-900">
                  <span className="mr-2 text-ink-400">#{i + 1}</span>
                  {r.city}, {r.country}
                </h3>
                <ScoreRing score={r.score} />
              </div>
              <p className="mt-1 text-sm text-brand-700">{r.verdict}</p>

              {/* Rule-based breakdown */}
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {COMPONENTS.map((c) => (
                  <div key={c.key} title={`${c.label}: ${r.components[c.key]}/100`}>
                    <span className="text-xs text-ink-500">{c.label}</span>
                    <div className="mt-0.5 h-2 rounded bg-slate-100">
                      <div className="h-full rounded"
                        style={{ width: `${r.components[c.key]}%`, background: BAR_COLORS[c.key] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
