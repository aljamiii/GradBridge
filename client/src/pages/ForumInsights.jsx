import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

// Single accent for all single-measure charts (validated: contrast 3:1+ on white).
const ACCENT = "#4f46e5";

// Headline stat tile — a number's job is to be read, not charted.
function StatTile({ label, value, emoji }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-ink-500">{emoji} {label}</p>
      <p className="mt-1 text-3xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

// Ranked horizontal bar list: label | thin bar | value.
function BarList({ title, items, valueKey, labelKey, format = (v) => v, prefix = "" }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Not enough data yet.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {items.map((item) => (
            <div key={item[labelKey]} className="group flex items-center gap-3"
              title={`${item[labelKey]}: ${format(item[valueKey])}`}>
              <span className="w-28 shrink-0 truncate text-sm text-slate-600">
                {prefix}{item[labelKey]}
              </span>
              <div className="h-3.5 flex-1 rounded-r bg-slate-100">
                <div
                  className="h-full rounded-r transition-opacity group-hover:opacity-80"
                  style={{ width: `${(item[valueKey] / max) * 100}%`, background: ACCENT }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-medium text-ink-700">
                {format(item[valueKey])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Monthly column chart for the seasonal trend.
function MonthColumns({ items }) {
  const max = Math.max(...items.map((i) => i.posts), 1);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        Seasonal trend — posts per month
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Not enough data yet.</p>
      ) : (
        <div className="mt-4 flex h-36 items-end gap-1.5">
          {items.map((m) => (
            <div key={m.label} className="group flex flex-1 flex-col items-center gap-1"
              title={`${m.label}: ${m.posts} post${m.posts !== 1 ? "s" : ""}`}>
              <span className="text-xs font-medium text-ink-700 opacity-0 transition-opacity group-hover:opacity-100">
                {m.posts}
              </span>
              <div
                className="w-full rounded-t transition-opacity group-hover:opacity-80"
                style={{
                  height: `${(m.posts / max) * 100}%`,
                  minHeight: 3,
                  background: ACCENT,
                }}
              />
              <span className="text-[10px] text-ink-400">{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ForumInsights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/forum/insights")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Community Insights</h1>
          <p className="mt-1 text-ink-500">
            What the community is talking about — computed live from forum activity.
          </p>
        </div>
        <Link to="/forum" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to forum
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!data ? (
        <p className="py-16 text-center text-ink-400">Crunching the numbers…</p>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatTile emoji="📝" label="Total posts" value={data.totals.posts} />
            <StatTile emoji="▲" label="Total upvotes" value={data.totals.upvotes} />
            <StatTile emoji="💬" label="Total replies" value={data.totals.comments} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <BarList title="Top concerns — most-discussed topics"
              items={data.topTags} labelKey="tag" valueKey="posts" prefix="#" />
            <BarList title="Highest-rated topics (avg ★)"
              items={data.ratingByTag} labelKey="tag" valueKey="avgRating"
              format={(v) => `${v}★`} prefix="#" />
            <BarList title="Discussion by city"
              items={data.byCity} labelKey="city" valueKey="posts" />
            <MonthColumns items={data.byMonth} />
          </div>

          <p className="mt-4 text-xs text-ink-400">
            All figures aggregate live forum data (MongoDB aggregation pipelines).
          </p>
        </>
      )}
    </div>
  );
}
