import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import ConnectButton, { useConnectionStatuses } from "../components/Connect";
import Icon from "../components/Icon";
import { Avatar, EmptyState, Skeleton, cx } from "../components/ui";

const inputClass =
  "w-full rounded-xl border border-white/70 bg-white/60 backdrop-blur-sm px-3.5 py-2.5 text-ink-900 placeholder-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

const humanHours = (h) => {
  if (h == null) return null;
  if (h < 1) return "under an hour";
  if (h < 24) return `~${h % 1 === 0 ? h : h.toFixed(1)} hours`;
  const d = Math.round(h / 24);
  return `~${d} day${d === 1 ? "" : "s"}`;
};

// Track record, derived from real bookings — the counterpart to the match
// percentage. Match says "relevant"; this says "reliable".
function TrackRecord({ record }) {
  if (!record) return null;
  const { sessionsCompleted, confirmRate, medianResponseHours, avgRating, ratingCount } = record;

  const facts = [
    sessionsCompleted > 0 &&
      `${sessionsCompleted} session${sessionsCompleted === 1 ? "" : "s"} completed`,
    medianResponseHours != null && `usually replies in ${humanHours(medianResponseHours)}`,
    confirmRate != null && `confirms ${Math.round(confirmRate * 100)}% of requests`,
  ].filter(Boolean);

  // The rating sits apart from the derived stats: it is a human judgement of
  // quality, not a fact about behaviour. Always paired with its count so a
  // single 5★ can't masquerade as a reputation.
  const rating = avgRating != null && (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
      <span aria-hidden="true">★</span>
      <span className="font-semibold">{avgRating.toFixed(1)}</span>
      <span className="text-amber-600/80">
        ({ratingCount} rating{ratingCount === 1 ? "" : "s"})
      </span>
    </span>
  );

  if (facts.length === 0) {
    return (
      <p className="mt-2 text-xs text-ink-400">
        ✦ New mentor — no completed sessions yet
      </p>
    );
  }

  return (
    <p
      className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-ink-500"
      title="Calculated from real booking activity — not self-reported."
    >
      {rating}
      <span>
        {facts.map((f, i) => (
          <span key={f}>
            {i > 0 && <span className="text-ink-300"> · </span>}
            {i === 0 && "✓ "}
            {f}
          </span>
        ))}
      </span>
    </p>
  );
}

// Criterion weights are stored as points; the UI speaks in percent of the
// rule's ceiling. The headline is computed from the raw scores (never from
// summing rounded rows), so it is always exact.
const asPercent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

// Earliest bookable slot, as the "YYYY-MM-DDTHH:mm" that datetime-local wants
// (toISOString would shift into UTC and let the user pick a past local time).
const minBookingTime = () => {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

// Booking form that expands inside a mentor card.
function BookingForm({ mentor, onDone }) {
  const [form, setForm] = useState({ start: "", durationMins: 30, topic: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const book = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api("/api/bookings", {
        method: "POST",
        body: { mentorId: mentor.id, ...form },
      });
      setMessage({ type: "ok", text: "Request sent! The mentor will confirm — watch your Bookings page." });
      onDone?.();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={book} className="mt-4 space-y-3 rounded-lg bg-white/45 p-4">
      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${
          message.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {message.text}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-500">Date &amp; time</span>
          <input type="datetime-local" required value={form.start}
            // The server rejects past datetimes; stop them in the picker so the
            // user never gets that error in the first place.
            min={minBookingTime()}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
            className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-500">Duration</span>
          <select value={form.durationMins} aria-label="Session duration"
            onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })}
            className={inputClass}>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </label>
      </div>
      <input placeholder="Topic (e.g., SOP review for UofT)" value={form.topic} aria-label="Session topic"
        onChange={(e) => setForm({ ...form, topic: e.target.value })}
        maxLength={200} className={inputClass} />
      <button type="submit" disabled={busy}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {busy ? "Booking…" : "Request session"}
      </button>
    </form>
  );
}

function MentorCard({ mentor, isTop, maxScore }) {
  const [showBooking, setShowBooking] = useState(false);
  const [chatError, setChatError] = useState("");
  const navigate = useNavigate();

  const openChat = async () => {
    try {
      const data = await api("/api/chat/start", {
        method: "POST",
        body: { userId: mentor.id },
      });
      navigate(`/chat?c=${data.conversationId}`);
    } catch (err) {
      setChatError(err.message);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 gap-3">
          <Avatar name={mentor.name} size="md" />
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
              {mentor.name}
              {isTop && (
                <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                  Best match
                </span>
              )}
            </h3>
            <p className="text-sm text-ink-500">
              {mentor.qualification}
              {mentor.university && ` · ${mentor.university}`}
            </p>
            {(mentor.city || mentor.country) && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-400">
                <Icon name="location" className="h-3 w-3 shrink-0" />
                {[mentor.city, mentor.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>
        {mentor.matchScore > 0 && (
          <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            🎯 {asPercent(mentor.matchScore, maxScore)}% match
          </span>
        )}
      </div>

      <TrackRecord record={mentor.trackRecord} />

      {/* The rule, audited one profile field at a time. A bare score can't be
          checked by the person it's about; this can. */}
      {mentor.breakdown?.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/45 p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className={cx(
                  "h-full rounded-full transition-all",
                  mentor.matchScore === 0 ? "bg-slate-300" : "bg-brand-500"
                )}
                style={{
                  width: `${maxScore ? Math.max(6, (mentor.matchScore / maxScore) * 100) : 6}%`,
                }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-medium text-ink-400">
              {asPercent(mentor.matchScore, maxScore)}% profile match
            </span>
          </div>
          <ul className="space-y-1">
            {mentor.breakdown.map((b) => (
              <li key={b.label} className="flex items-start gap-2 text-xs">
                <span
                  aria-hidden="true"
                  className={cx(
                    "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                    b.matched ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                  )}
                >
                  {b.matched ? "✓" : "–"}
                </span>
                <span className={b.matched ? "text-ink-600" : "text-ink-400"}>
                  <span className="font-medium">{b.label}</span>
                  {/* Each criterion's share of the total, so the rows add up
                      to the headline — arithmetic the reader can check rather
                      than a number they have to trust. */}
                  <span className={b.matched ? "text-green-700" : "text-ink-300"}>
                    {" "}
                    (
                    {b.matched
                      ? `+${asPercent(b.weight, maxScore)}%`
                      : `0 of ${asPercent(b.weight, maxScore)}%`}
                    )
                  </span>
                  <span className="text-ink-400">: </span>
                  {b.value}
                  {b.matched && b.hits?.length > 0 && (
                    <span className="text-green-700"> → {b.hits.join(", ")}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mentor.expertise?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.expertise.map((tag) => {
            // Highlight the tags that actually earned the score.
            const earned = mentor.matchedOn?.some((t) => tag.toLowerCase().includes(t));
            return (
              <span
                key={tag}
                className={cx(
                  "rounded-full px-2.5 py-0.5 text-xs",
                  earned
                    ? "bg-green-100 font-medium text-green-700 ring-1 ring-green-200"
                    : "bg-brand-50 text-brand-700"
                )}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}

      {mentor.availability && (
        <p className="mt-2 text-sm text-ink-500">🕒 {mentor.availability}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={() => setShowBooking(!showBooking)}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          {showBooking ? "Close" : "📅 Book session"}
        </button>
        <button onClick={openChat}
          className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-medium text-ink-700 hover:bg-slate-200">
          Message
        </button>
        <ConnectButton userId={mentor.id} name={mentor.name} size="md" />
      </div>

      {chatError && (
        <p role="alert" className="mt-2 text-xs text-red-600">{chatError}</p>
      )}

      {showBooking && <BookingForm mentor={mentor} />}
    </div>
  );
}

export default function Mentors() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [sort, setSort] = useState("match");
  const [showRule, setShowRule] = useState(false);
  const [need, setNeed] = useState("");
  const [reranking, setReranking] = useState(false);

  // Refetch when the stated need changes — the ranking is recomputed server
  // side, so the rule stays in one place. Previous results stay on screen
  // while it reloads, so switching needs re-ranks instead of flashing skeletons.
  useEffect(() => {
    setReranking(true);
    api(`/api/mentors${need ? `?need=${encodeURIComponent(need)}` : ""}`)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setReranking(false));
  }, [need]);

  const mentors = data?.mentors ?? null;
  const criteria = data?.criteria ?? [];
  const maxScore = data?.maxScore ?? 0;
  const needOptions = data?.needOptions ?? [];

  // One bulk status call for every mentor on screen.
  useConnectionStatuses((mentors ?? []).map((m) => String(m.id)));

  // Every expertise tag on offer, for the filter dropdown.
  const allTags = useMemo(
    () => [...new Set((mentors ?? []).flatMap((m) => m.expertise ?? []))].sort(),
    [mentors]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (mentors ?? []).filter(
      (m) =>
        (tag === "all" || m.expertise?.includes(tag)) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          (m.qualification ?? "").toLowerCase().includes(q) ||
          (m.university ?? "").toLowerCase().includes(q) ||
          (m.expertise ?? []).some((t) => t.toLowerCase().includes(q)))
    );
    // The server already sorts by score; re-sort only when the user asks.
    return sort === "name"
      ? [...list].sort((a, b) => a.name.localeCompare(b.name))
      : list;
  }, [mentors, query, tag, sort]);

  const unmatched = (mentors ?? []).filter((m) => m.matchScore === 0).length;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">
        Find a Mentor
      </h1>
      <p className="mt-1 text-ink-500">
        Verified mentors, ranked by how well they match your profile (country,
        research interest, background).
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* What the ranking is matching you ON. Showing the inputs makes the
          score auditable and tells the student how to improve it. */}
      {mentors !== null && (
        <div className="glass-card mt-6 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
              Matching against your profile
            </h2>
            <button
              onClick={() => setShowRule((v) => !v)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              {showRule ? "Hide" : "How does ranking work?"}
            </button>
          </div>

          {criteria.length === 0 ? (
            <p className="mt-2 text-sm text-ink-500">
              Your profile has none of the fields the matcher uses yet —{" "}
              <Link to="/profile" className="font-medium text-brand-600 hover:underline">
                add your country, research interest, and degree
              </Link>{" "}
              to get a ranked list instead of an alphabetical one.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {criteria.map((c) => (
                <span
                  key={c.label}
                  className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-ink-600"
                  title={c.label}
                >
                  <span className="text-ink-400">{c.label}:</span>{" "}
                  <span className="font-medium">{c.value}</span>
                </span>
              ))}
              <Link
                to="/profile"
                className="ml-1 text-xs font-medium text-brand-600 hover:underline"
              >
                Edit
              </Link>
            </div>
          )}

          {/* A stated need beats an inferred similarity, so it outweighs every
              profile criterion — and it makes the list answer "who can help me
              with this" rather than only "who is like me". */}
          {needOptions.length > 0 && (
            <div className="mt-3 border-t border-white/60 pt-3">
              <p className="mb-2 text-xs font-medium text-ink-500">
                What do you need help with right now?{" "}
                <span className="font-normal text-ink-400">
                  (optional — re-ranks the list)
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setNeed("")}
                  aria-pressed={need === ""}
                  className={cx(
                    "rounded-full px-3 py-1 text-xs transition-colors",
                    need === ""
                      ? "bg-brand-600 font-medium text-white"
                      : "bg-white/70 text-ink-600 hover:bg-white"
                  )}
                >
                  Anything
                </button>
                {needOptions.map((n) => (
                  <button
                    key={n.key}
                    onClick={() => setNeed(n.key)}
                    aria-pressed={need === n.key}
                    className={cx(
                      "rounded-full px-3 py-1 text-xs capitalize transition-colors",
                      need === n.key
                        ? "bg-brand-600 font-medium text-white"
                        : "bg-white/70 text-ink-600 hover:bg-white"
                    )}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showRule && (
            <div className="mt-3 rounded-lg bg-white/50 p-3 text-xs leading-relaxed text-ink-500">
              <p>
                <span className="font-semibold text-ink-600">Rule-based, no AI.</span>{" "}
                Each criterion below either matches or it doesn’t, and a match is
                worth a fixed share of the total — so the percentage is arithmetic
                you can check by hand, and it doesn’t change if you reword your profile.
              </p>
              <ul className="mt-2 space-y-0.5">
                {criteria.map((c) => (
                  <li key={c.label}>
                    <span className="font-medium text-ink-600">
                      {c.label} — worth {asPercent(c.weight, maxScore)}%
                    </span>
                    {c.label === "Preferred country"
                      ? " — compared against the country the mentor actually studies in."
                      : c.label === "Need help with"
                        ? " — matched against the mentor’s expertise tags."
                        : " — matched on shared words (lowercased, 3+ letters, common words like “university” dropped)."}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                Research interest is weighted highest because it is what a
                session is actually about; a shared degree background breaks ties.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Controls only earn their space once there is enough to sift. */}
      {mentors !== null && mentors.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, university, or expertise…"
            aria-label="Search mentors"
            className={`${inputClass} min-w-0 flex-1 !py-2 text-sm`}
          />
          {allTags.length > 0 && (
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              aria-label="Filter by expertise"
              className={`${inputClass} !w-auto !py-2 text-sm`}
            >
              <option value="all">All expertise</option>
              {allTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort mentors"
            className={`${inputClass} !w-auto !py-2 text-sm`}
          >
            <option value="match">Best match first</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      )}

      <div className={cx("mt-4 space-y-4 transition-opacity", reranking && "opacity-60")}>
        {mentors === null ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)
        ) : mentors.length === 0 ? (
          <EmptyState
            icon={<Icon name="users" className="h-6 w-6" />}
            title="No mentors available yet"
            description="Mentors appear here once an admin verifies them. Meanwhile, the Network Map has students already living where you want to go."
            className="!py-14"
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" className="h-6 w-6" />}
            title="No mentors match that"
            description="Try a different search term or clear the expertise filter."
            className="!py-12"
          />
        ) : (
          <>
            <p className="text-xs text-ink-400">
              Showing {visible.length} of {mentors.length} verified mentor
              {mentors.length === 1 ? "" : "s"}
              {need && ` · ranked for “${needOptions.find((n) => n.key === need)?.label ?? need}”`}
              {sort === "match" && unmatched > 0 && ` · ${unmatched} with no overlap`}
            </p>
            {visible.map((m, i) => (
              <MentorCard
                key={m.id}
                mentor={m}
                maxScore={maxScore}
                // Only crown a leader when there is a field to lead and the
                // ranking actually separates them — a lone filtered result
                // isn't "the best match", it's just the only one left.
                isTop={
                  sort === "match" &&
                  i === 0 &&
                  visible.length > 1 &&
                  m.matchScore > 0 &&
                  m.matchScore > (visible[1]?.matchScore ?? 0)
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
