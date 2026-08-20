import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const ACCENT = "#4f46e5"; // validated single-series accent (see ForumInsights)

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none";

function StatTile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-ink-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

// Horizontal bar with the value labeled at the end.
function Bar({ label, value, max, format }) {
  return (
    <div className="group flex items-center gap-3" title={`${label}: ${format(value)}`}>
      <span className="w-32 shrink-0 truncate text-sm text-slate-600">{label}</span>
      <div className="h-3.5 flex-1 rounded-r bg-slate-100">
        <div className="h-full rounded-r transition-opacity group-hover:opacity-80"
          style={{ width: `${max ? (value / max) * 100 : 0}%`, background: ACCENT }} />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-medium text-ink-700">
        {format(value)}
      </span>
    </div>
  );
}

export default function SuccessPath() {
  const [filters, setFilters] = useState({ minCgpa: "", maxCgpa: "", country: "", field: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showTable, setShowTable] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    api(`/api/success-path?${params}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const fundingMax = data
    ? Math.max(data.funding.full, data.funding.partial, data.funding.self, 1)
    : 1;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Success Path Explorer</h1>
      <p className="mt-1 text-ink-500">
        Real admission records from students who came before you — filter by your
        background to see honest odds.
      </p>

      {/* Background filters (spec: CGPA, degree/field, country) */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input type="number" step="0.1" min="2" max="4" placeholder="Min CGPA"
          value={filters.minCgpa}
          onChange={(e) => setFilters({ ...filters, minCgpa: e.target.value })}
          className={`${inputClass} w-28`} />
        <input type="number" step="0.1" min="2" max="4" placeholder="Max CGPA"
          value={filters.maxCgpa}
          onChange={(e) => setFilters({ ...filters, maxCgpa: e.target.value })}
          className={`${inputClass} w-28`} />
        <select value={filters.field}
          onChange={(e) => setFilters({ ...filters, field: e.target.value })}
          className={inputClass}>
          <option value="">All fields</option>
          {data?.options.fields.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          className={inputClass}>
          <option value="">All countries</option>
          {data?.options.countries.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!data ? (
        <p className="py-16 text-center text-ink-400">Loading records…</p>
      ) : data.totals.records === 0 ? (
        <p className="py-16 text-center text-ink-400">
          No records match these filters — widen the CGPA range.
        </p>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <StatTile label="Matching records" value={data.totals.records} />
            <StatTile label="Acceptance rate" value={`${data.totals.acceptanceRate}%`}
              hint={`${data.totals.admitted} admitted`} />
            <StatTile label="Full funding" value={`${data.totals.fullFundingRate}%`}
              hint="of admitted students" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Acceptance rate by CGPA range */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Acceptance rate by CGPA range
              </h2>
              <div className="mt-4 flex h-36 items-end gap-3">
                {data.cgpaBuckets.map((b) => (
                  <div key={b.label} className="group flex flex-1 flex-col items-center gap-1"
                    title={`${b.label}: ${b.admitted}/${b.total} admitted (${b.rate}%)`}>
                    <span className="text-xs font-medium text-ink-700">
                      {b.total ? `${b.rate}%` : "—"}
                    </span>
                    <div className="w-full rounded-t transition-opacity group-hover:opacity-80"
                      style={{ height: `${b.rate}%`, minHeight: b.total ? 3 : 0, background: ACCENT }} />
                    <span className="text-[10px] text-ink-400">{b.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-400">n = {data.totals.records} applications</p>
            </div>

            {/* Funding distribution */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                How admitted students were funded
              </h2>
              <div className="mt-4 space-y-2.5">
                <Bar label="Full funding" value={data.funding.full} max={fundingMax} format={(v) => v} />
                <Bar label="Partial" value={data.funding.partial} max={fundingMax} format={(v) => v} />
                <Bar label="Self-funded" value={data.funding.self} max={fundingMax} format={(v) => v} />
              </div>
            </div>

            {/* Admission patterns by country */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                Admission patterns by destination
              </h2>
              <div className="mt-4 space-y-2.5">
                {data.countries.map((c) => (
                  <Bar key={c.country} label={c.country} value={c.rate}
                    max={100} format={(v) => `${v}% (${c.admitted}/${c.total})`} />
                ))}
              </div>
            </div>
          </div>

          {/* Records table */}
          <button onClick={() => setShowTable(!showTable)}
            className="mt-4 text-sm font-medium text-brand-600 hover:underline">
            {showTable ? "Hide" : "Show"} the underlying records ({data.records.length})
          </button>
          {showTable && (
            <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-400">
                    {["Year", "Field", "CGPA", "IELTS", "University", "Country", "Funding", "Outcome"].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-600">{r.year}</td>
                      <td className="px-3 py-2 text-slate-600">{r.field}</td>
                      <td className="px-3 py-2 font-medium text-ink-900">{r.cgpa}</td>
                      <td className="px-3 py-2 text-slate-600">{r.ielts}</td>
                      <td className="px-3 py-2 text-slate-600">{r.university}</td>
                      <td className="px-3 py-2 text-slate-600">{r.country}</td>
                      <td className="px-3 py-2 text-slate-600">{r.funding}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.outcome === "admitted"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {r.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-ink-400">
            Data source: alumni records sheet (Google Sheets) — anonymized. Past
            admissions don&apos;t guarantee future outcomes.
          </p>
        </>
      )}
    </div>
  );
}
