import { useEffect, useState } from "react";
import { api } from "../lib/api";

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none";

const LEVEL_STYLES = {
  strong: "bg-green-50 border-green-200 text-green-800",
  close: "bg-amber-50 border-amber-200 text-amber-800",
  below: "bg-red-50 border-red-200 text-red-800",
};
const LEVEL_EMOJI = { strong: "✅", close: "⚖️", below: "❌" };

// ---------------- Job market section ----------------
function JobMarket() {
  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState({ country: "Canada", field: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/tools/job-market/countries")
      .then((d) => setCountries(d.countries))
      .catch(() => {});
  }, []);

  const search = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setData(null);
    try {
      const params = new URLSearchParams(form);
      setData(await api(`/api/tools/job-market?${params}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold text-ink-900">💼 Live Job Market</h2>
      <p className="mt-0.5 text-sm text-ink-500">
        How many jobs exist in your field right now — live from Adzuna.
      </p>

      <form onSubmit={search} className="mt-4 flex flex-wrap gap-2">
        <select value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
          className={inputClass}>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input value={form.field} required placeholder="Field (e.g., software engineer)"
          onChange={(e) => setForm({ ...form, field: e.target.value })}
          className={`${inputClass} flex-1 min-w-48`} />
        <button type="submit" disabled={loading}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
          {loading ? "Searching…" : "Check market"}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      )}

      {data && (
        <div className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-ink-500">Open positions</p>
              <p className="text-2xl font-bold text-ink-900">{data.count.toLocaleString()}</p>
              <p className="text-xs text-ink-400">"{data.field}" in {data.country}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-ink-500">Avg advertised salary</p>
              <p className="text-2xl font-bold text-ink-900">
                {data.avgSalary ? data.avgSalary.toLocaleString() : "—"}
              </p>
              <p className="text-xs text-ink-400">local currency, from live ads</p>
            </div>
          </div>
          {data.sampleJobs?.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.sampleJobs.map((j) => (
                <a key={j.url} href={j.url} target="_blank" rel="noreferrer"
                  className="block truncate text-sm text-brand-600 hover:underline">
                  ↗ {j.title} — {j.company ?? "?"}, {j.location ?? ""}
                </a>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-400">Source: {data.source}</p>
        </div>
      )}
    </section>
  );
}

// ---------------- PR points section ----------------
function PRCalculator() {
  const [form, setForm] = useState({
    age: 24, education: "bachelors", yearsExperience: 1, ielts: 7,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const compute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      setData(await api("/api/tools/pr-points", { method: "POST", body: form }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-semibold text-ink-900">🏅 PR Points Estimator</h2>
      <p className="mt-0.5 text-sm text-ink-500">
        Rule-based scoring modeled on the real Canada CRS and Australia 189 systems.
      </p>

      <form onSubmit={compute} className="mt-4 grid gap-3 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-500">Age</span>
          <input type="number" min={16} max={60} required value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className={`${inputClass} w-full`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-500">Highest education</span>
          <select value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
            className={`${inputClass} w-full`}>
            <option value="highschool">High school</option>
            <option value="bachelors">Bachelor&apos;s</option>
            <option value="masters">Master&apos;s</option>
            <option value="phd">PhD</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-500">Years of work experience</span>
          <input type="number" min={0} max={30} value={form.yearsExperience}
            onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
            className={`${inputClass} w-full`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-500">IELTS overall</span>
          <input type="number" min={4} max={9} step={0.5} value={form.ielts}
            onChange={(e) => setForm({ ...form, ielts: e.target.value })}
            className={`${inputClass} w-full`} />
        </label>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:col-span-4 sm:justify-self-start">
          {loading ? "Computing…" : "Calculate my points"}
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {data.pathways.map((p) => (
            <div key={p.system} className={`rounded-xl border p-5 ${LEVEL_STYLES[p.level]}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{p.system}</h3>
                <span className="shrink-0 text-2xl font-bold">
                  {p.total}
                  <span className="text-sm font-normal opacity-60">/{p.maxTotal}</span>
                </span>
              </div>
              <p className="mt-1 text-sm">
                {LEVEL_EMOJI[p.level]} {p.verdict}
              </p>
              <p className="text-xs opacity-60">({p.passHint})</p>

              {/* Explainable factor breakdown */}
              <div className="mt-3 space-y-1.5">
                {p.breakdown.map((b) => (
                  <div key={b.factor} className="flex items-center gap-2 text-sm">
                    <span className="w-52 shrink-0 truncate opacity-80" title={b.factor}>
                      {b.factor}
                    </span>
                    <div className="h-2 flex-1 rounded bg-white/60">
                      <div className="h-full rounded bg-current opacity-50"
                        style={{ width: `${(b.points / b.max) * 100}%` }} />
                    </div>
                    <span className="w-14 shrink-0 text-right font-medium">
                      {b.points}/{b.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-ink-400 lg:col-span-2">{data.note}</p>
        </div>
      )}
    </section>
  );
}

export default function JobMarketPR() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-4 py-10">
      <div>
        <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Job Market & PR Outlook</h1>
        <p className="mt-1 text-ink-500">
          What happens after graduation — real job demand and your permanent-residency odds.
        </p>
      </div>
      <JobMarket />
      <PRCalculator />
    </div>
  );
}

