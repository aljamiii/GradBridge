import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const inputClass =
  "rounded-xl border border-white/70 bg-white/60 backdrop-blur-sm px-3.5 py-2.5 text-sm text-ink-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none";

const FUNDING_BADGE = {
  full: { text: "💰 Fully funded", style: "bg-green-100 text-green-700" },
  partial: { text: "Partial funding", style: "bg-amber-100 text-amber-700" },
  varies: { text: "Funding varies", style: "bg-sky-100 text-sky-700" },
  unknown: { text: "Funding unclear", style: "bg-slate-100 text-ink-500" },
};

export default function Scholarships() {
  const [filters, setFilters] = useState({ country: "", fundingType: "all", q: "" });
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.country) params.set("country", filters.country);
    if (filters.fundingType !== "all") params.set("fundingType", filters.fundingType);
    if (filters.q) params.set("q", filters.q);
    api(`/api/scholarships?${params}`)
      .then((d) => setItems(d.scholarships))
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce typing
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Scholarships & Programs</h1>
      <p className="mt-1 text-ink-500">
        Auto-collected from official sources, structured by AI, and quality-checked
        by admins. Refreshed daily.
      </p>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-2">
        <input value={filters.q} placeholder="Search title…" aria-label="Search scholarships by title"
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className={`${inputClass} flex-1 min-w-40`} />
        <input value={filters.country} placeholder="Country" aria-label="Filter by country"
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          className={`${inputClass} w-36`} />
        <select value={filters.fundingType} aria-label="Filter by funding type"
          onChange={(e) => setFilters({ ...filters, fundingType: e.target.value })}
          className={inputClass}>
          <option value="all">All funding</option>
          <option value="full">Fully funded</option>
          <option value="partial">Partial</option>
          <option value="varies">Varies</option>
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-5 space-y-3">
        {items === null ? (
          <p className="py-10 text-center text-ink-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-ink-400">
            No approved scholarships match — try clearing filters.
          </p>
        ) : (
          items.map((s) => {
            const badge = FUNDING_BADGE[s.fundingType] ?? FUNDING_BADGE.unknown;
            return (
              <div key={s._id} className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink-900">{s.title}</h3>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.style}`}>
                    {badge.text}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  {[s.provider, s.country, s.degreeLevels?.join("/")]
                    .filter(Boolean).join(" · ")}
                </p>
                {s.deadline && (
                  <p className="mt-1 text-sm font-medium text-rose-600">⏰ Deadline: {s.deadline}</p>
                )}
                {s.eligibility && (
                  <p className="mt-2 text-sm text-slate-600">{s.eligibility}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {s.link ? (
                    <a href={s.link} target="_blank" rel="noreferrer"
                      className="text-sm font-medium text-brand-600 hover:underline">
                      View details ↗
                    </a>
                  ) : <span />}
                  <span className="text-xs text-ink-400">via {s.source}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
