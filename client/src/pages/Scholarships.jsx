import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none";

const FUNDING_BADGE = {
  full: { text: "💰 Fully funded", style: "bg-green-100 text-green-700" },
  partial: { text: "Partial funding", style: "bg-amber-100 text-amber-700" },
  varies: { text: "Funding varies", style: "bg-sky-100 text-sky-700" },
  unknown: { text: "Funding unclear", style: "bg-slate-100 text-slate-500" },
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
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800">🎁 Scholarships & Programs</h1>
      <p className="mt-1 text-slate-500">
        Auto-collected from official sources, structured by AI, and quality-checked
        by admins. Refreshed daily.
      </p>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-2">
        <input value={filters.q} placeholder="Search title…"
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className={`${inputClass} flex-1 min-w-40`} />
        <input value={filters.country} placeholder="Country"
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          className={`${inputClass} w-36`} />
        <select value={filters.fundingType}
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
          <p className="py-10 text-center text-slate-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-slate-400">
            No approved scholarships match — try clearing filters.
          </p>
        ) : (
          items.map((s) => {
            const badge = FUNDING_BADGE[s.fundingType] ?? FUNDING_BADGE.unknown;
            return (
              <div key={s._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800">{s.title}</h3>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${badge.style}`}>
                    {badge.text}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
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
                      className="text-sm font-medium text-indigo-600 hover:underline">
                      View details ↗
                    </a>
                  ) : <span />}
                  <span className="text-xs text-slate-400">via {s.source}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
