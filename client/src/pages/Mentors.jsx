import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import ConnectButton, { useConnectionStatuses } from "../components/Connect";
import Icon from "../components/Icon";
import { Avatar, EmptyState, Skeleton, cx } from "../components/ui";

const inputClass =
  "w-full rounded-xl border border-white/70 bg-white/60 backdrop-blur-sm px-3.5 py-2.5 text-ink-900 placeholder-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

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
          <select value={form.durationMins}
            onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })}
            className={inputClass}>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </label>
      </div>
      <input placeholder="Topic (e.g., SOP review for UofT)" value={form.topic}
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
          </div>
        </div>
        {mentor.matchScore > 0 && (
          <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            🎯 {mentor.matchScore} match{mentor.matchScore > 1 ? "es" : ""}
          </span>
        )}
      </div>

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
              {mentor.matchScore}/{maxScore || 0} signals
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
                  <span className="font-medium">{b.label}:</span> {b.value}
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

  useEffect(() => {
    api("/api/mentors").then(setData).catch((err) => setError(err.message));
  }, []);

  const mentors = data?.mentors ?? null;
  const criteria = data?.criteria ?? [];
  const maxScore = data?.maxScore ?? 0;

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

          {showRule && (
            <p className="mt-3 rounded-lg bg-white/50 p-3 text-xs leading-relaxed text-ink-500">
              <span className="font-semibold text-ink-600">Rule-based, no AI.</span>{" "}
              Your country, research interest, and degree are split into words
              (lowercased, 3+ letters, common words like “university” dropped).
              The same is done to each mentor’s qualification, university, and
              expertise tags. The score is the number of distinct words that
              appear in both — so every rank is a number you can recount by hand.
            </p>
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

      <div className="mt-4 space-y-4">
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
              {sort === "match" && unmatched > 0 && ` · ${unmatched} with no profile overlap`}
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
