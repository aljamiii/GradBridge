import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Avatar, Skeleton, cx } from "../components/ui";

// Single accent for all single-measure charts (validated: contrast 3:1+ on white).
const ACCENT = "#4f46e5";

// Headline stat tile — a number's job is to be read, not charted.
function StatTile({ label, value, emoji }) {
  return (
    <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm text-ink-500">{emoji} {label}</p>
      <p className="mt-1 text-3xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

// Ranked horizontal bar list: label | thin bar | value.
// `linkFor` turns a row into a deep link back to the filtered forum, so the
// dashboard is a way IN to the discussion rather than a dead end.
function BarList({ title, items, valueKey, labelKey, format = (v) => v, prefix = "", linkFor, subtitleFor }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Not enough data yet.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {items.map((item) => {
            const row = (
              <>
                <span className={cx("shrink-0 truncate", subtitleFor ? "w-36" : "w-28")}>
                  <span className="block truncate text-sm text-slate-600 group-hover:text-brand-700">
                    {prefix}{item[labelKey]}
                  </span>
                  {subtitleFor?.(item) && (
                    <span className="block truncate text-[10px] leading-tight text-ink-400">
                      {subtitleFor(item)}
                    </span>
                  )}
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
              </>
            );
            const to = linkFor?.(item);
            const label = `${item[labelKey]}: ${format(item[valueKey])}`;
            return to ? (
              <Link key={item[labelKey]} to={to} title={`${label} — see these posts`}
                className="group flex items-center gap-3 rounded-lg transition-colors hover:bg-white/60">
                {row}
              </Link>
            ) : (
              <div key={item[labelKey]} className="group flex items-center gap-3" title={label}>
                {row}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



// "Top concerns" already arrives with posts, upvotes AND replies per tag —
// the pipeline computed all three and the chart only ever drew one. A toggle
// re-reads the same payload, so switching metric costs no extra request.
const TAG_METRICS = [
  { id: "posts", label: "Posts" },
  { id: "upvotes", label: "Upvotes" },
  { id: "comments", label: "Replies" },
];

function TopConcerns({ items }) {
  const [metric, setMetric] = useState("posts");
  const ranked = [...items].sort((a, b) => b[metric] - a[metric]);
  const max = Math.max(...ranked.map((i) => i[metric]), 1);

  return (
    <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Top concerns — most-discussed topics
        </h2>
        <div className="flex gap-0.5 rounded-lg bg-white/60 p-0.5 ring-1 ring-white/70">
          {TAG_METRICS.map((m) => (
            <button key={m.id} onClick={() => setMetric(m.id)}
              aria-pressed={metric === m.id}
              className={cx(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                metric === m.id ? "bg-white text-brand-700 shadow-sm" : "text-ink-400 hover:text-ink-700"
              )}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {ranked.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Not enough data yet.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {ranked.map((item) => (
            <Link key={item.tag} to={`/forum?tag=${encodeURIComponent(item.tag)}`}
              title={`${item.tag}: ${item.posts} posts · ${item.upvotes} upvotes · ${item.comments} replies`}
              className="group flex items-center gap-3 rounded-lg transition-colors hover:bg-white/60">
              <span className="w-28 shrink-0 truncate text-sm text-slate-600 group-hover:text-brand-700">
                {item.tag}
              </span>
              <div className="h-3.5 flex-1 rounded-r bg-slate-100">
                <div className="h-full rounded-r transition-all duration-300 group-hover:opacity-80"
                  style={{ width: `${(item[metric] / max) * 100}%`, background: ACCENT }} />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums text-ink-700">
                {item[metric]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Rating distribution — an average hides whether opinion is united or split.
function RatingSpread({ items }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const max = Math.max(...items.map((i) => i.count), 1);
  const weighted = total
    ? Math.round((items.reduce((sum, i) => sum + i.stars * i.count, 0) / total) * 10) / 10
    : null;

  return (
    <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          How posts get rated
        </h2>
        {weighted != null && (
          <span className="text-sm font-semibold text-ink-700">{weighted}★ avg</span>
        )}
      </div>
      {total === 0 ? (
        <p className="mt-3 text-sm text-ink-400">No ratings yet.</p>
      ) : (
        <>
          <div className="mt-4 flex h-32 items-end gap-3">
            {items.map((i) => {
              const pct = Math.round((i.count / total) * 100);
              return (
                <div key={i.stars} className="group flex flex-1 flex-col items-center gap-1"
                  title={`${i.count} rating${i.count === 1 ? "" : "s"} at ${i.stars}★ (${pct}%)`}>
                  <span className="text-xs font-semibold text-ink-700">{i.count || ""}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div className="w-full rounded-t transition-all group-hover:opacity-80"
                      style={{
                        height: `${(i.count / max) * 100}%`,
                        minHeight: i.count ? 4 : 2,
                        background: i.count ? ACCENT : "#e2e8f0",
                      }} />
                  </div>
                  <span className="text-[11px] text-ink-400">{i.stars}★</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-400">
            {total} rating{total === 1 ? "" : "s"} across all posts
          </p>
        </>
      )}
    </div>
  );
}

// Who is carrying the community.
function Contributors({ items }) {
  return (
    <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        Top contributors
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Not enough data yet.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {items.map((c, i) => (
            <li key={c.name} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-ink-400">
                {i + 1}
              </span>
              <Avatar name={c.name} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-700">
                {c.name}
              </span>
              <span className="shrink-0 text-xs text-ink-400">
                {c.posts} post{c.posts === 1 ? "" : "s"} · {c.upvotes} ▲ · {c.comments} 💬
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// Monthly column chart for the seasonal trend.
function MonthColumns({ items }) {
  const max = Math.max(...items.map((i) => i.posts), 1);
  return (
    <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        Seasonal trend — posts per month
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-400">Not enough data yet.</p>
      ) : (
        <div className="mt-4 flex h-40 items-stretch gap-1.5">
          {items.map((m) => (
            // h-full on the column is what makes the bar's percentage height
            // resolve — without it the parent is auto-height and every bar
            // collapsed to its 3px minimum.
            <div key={m.label} className="group flex h-full flex-1 flex-col items-center gap-1"
              title={`${m.label}: ${m.posts} post${m.posts !== 1 ? "s" : ""}`}>
              <span className="text-xs font-semibold tabular-nums text-ink-700">
                {m.posts || ""}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${(m.posts / max) * 100}%`,
                    minHeight: m.posts ? 4 : 2,
                    background: m.posts ? ACCENT : "#e2e8f0",
                  }}
                />
              </div>
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
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
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
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatTile emoji="📝" label="Total posts" value={data.totals.posts} />
            <StatTile emoji="▲" label="Total upvotes" value={data.totals.upvotes} />
            <StatTile emoji="💬" label="Total replies" value={data.totals.comments} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TopConcerns items={data.topTags} />
            <BarList title="Highest-rated topics (avg ★)"
              items={data.ratingByTag} labelKey="tag" valueKey="avgRating"
              format={(v) => `${v}★`}
              linkFor={(i) => `/forum?tag=${encodeURIComponent(i.tag)}`} />
            <BarList title="Discussion by city"
              items={data.byCity} labelKey="city" valueKey="posts"
              subtitleFor={(i) => i.topTitle && `Top: ${i.topTitle}`}
              linkFor={(i) => `/forum?city=${encodeURIComponent(i.city)}`} />
            <RatingSpread items={data.ratingSpread ?? []} />
            <MonthColumns items={data.byMonth} />
            <Contributors items={data.contributors ?? []} />
          </div>

          <p className="mt-4 text-xs text-ink-400">
            All figures aggregate live forum data (MongoDB aggregation pipelines).
          </p>
        </>
      )}
    </div>
  );
}
