import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { Avatar, EmptyState, Skeleton, cx } from "../components/ui";

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-ink-500",
};

/* ---------------------------------------------------------------- helpers */

// "Sat, 12 Jul 2026" — readable, and unambiguous for a Bangladeshi audience
// (the old toLocaleString() rendered "7/12/2026, 10:00:00 AM", which reads as
// 7 December outside the US and showed pointless seconds).
const dayLine = (d) =>
  new Date(d).toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const clockLine = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// A soft "when" cue for sessions that are close enough to matter.
const countdown = (d) => {
  const ms = new Date(d).getTime() - Date.now();
  if (ms < 0) return null;
  const hours = Math.round(ms / 3600000);
  if (hours < 1) return "Starting soon";
  if (hours < 24) return `In ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Tomorrow";
  if (days <= 14) return `In ${days} days`;
  return null;
};

/* ------------------------------------------------------------------- card */

function SessionCard({ booking: b, isMentor, isPast, busy, onStatus, onMessage }) {
  const person = isMentor ? b.student : b.mentor;
  const soon = isPast ? null : countdown(b.start);
  // A session that has already happened can't be confirmed, declined, or
  // cancelled — offering those buttons was the confusing part before.
  const canAct = !isPast && !["cancelled", "declined"].includes(b.status);

  return (
    <div
      className={cx(
        "glass-card rounded-2xl p-5 shadow-[var(--shadow-card)] transition-opacity",
        isPast && "opacity-70"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <Avatar name={person?.name} size="md" />
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900">{person?.name ?? "Unknown"}</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" className="h-3.5 w-3.5 shrink-0" />
                {dayLine(b.start)}
              </span>
              {/* Hidden on narrow screens, where the two halves wrap onto
                  separate lines and the separator would dangle. */}
              <span aria-hidden="true" className="hidden text-ink-300 sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" className="h-3.5 w-3.5 shrink-0" />
                {clockLine(b.start)} · {b.durationMins} min
              </span>
            </p>
            {b.topic && <p className="mt-1.5 text-sm text-slate-600">📝 {b.topic}</p>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cx(
              "rounded-full px-3 py-1 text-xs font-medium capitalize",
              STATUS_BADGE[b.status]
            )}
          >
            {b.status}
          </span>
          {soon && (
            <span className="text-[11px] font-medium text-brand-600">{soon}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canAct && isMentor && b.status === "pending" && (
          <>
            <button
              onClick={() => onStatus(b._id, "confirmed")}
              disabled={busy}
              className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              ✓ Confirm
            </button>
            <button
              onClick={() => onStatus(b._id, "declined")}
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              ✕ Decline
            </button>
          </>
        )}
        {canAct && !isMentor && ["pending", "confirmed"].includes(b.status) && (
          <button
            onClick={() => onStatus(b._id, "cancelled")}
            disabled={busy}
            className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            Cancel session
          </button>
        )}
        {person?._id && (
          <button
            onClick={() => onMessage(person._id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:bg-slate-200"
          >
            <Icon name="message" className="h-3.5 w-3.5" />
            Message
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api("/api/bookings")
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    setBusy(true);
    setError("");
    try {
      await api(`/api/bookings/${id}/status`, { method: "PUT", body: { status } });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Cross-link into Module 2: talk to the other person without hunting for
  // them in the inbox.
  const openChat = async (userId) => {
    try {
      const d = await api("/api/chat/start", { method: "POST", body: { userId } });
      navigate(`/chat?c=${d.conversationId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const isMentor = user.role === "mentor";

  // Upcoming soonest-first (what you act on), past most-recent-first (what you
  // look back at). Mixing them by raw date buried the next session mid-list.
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const list = bookings ?? [];
    return {
      upcoming: list
        .filter((b) => new Date(b.start).getTime() >= now)
        .sort((a, b) => new Date(a.start) - new Date(b.start)),
      past: list
        .filter((b) => new Date(b.start).getTime() < now)
        .sort((a, b) => new Date(b.start) - new Date(a.start)),
    };
  }, [bookings]);

  const section = (label, items, isPast) =>
    items.length > 0 && (
      <section className="mt-8 first:mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
          {label}
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-ink-500">
            {items.length}
          </span>
        </h2>
        <div className="space-y-4">
          {items.map((b) => (
            <SessionCard
              key={b._id}
              booking={b}
              isMentor={isMentor}
              isPast={isPast}
              busy={busy}
              onStatus={setStatus}
              onMessage={openChat}
            />
          ))}
        </div>
      </section>
    );

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">
        My Sessions
      </h1>
      <p className="mt-1 text-ink-500">
        {isMentor
          ? "Session requests from students — confirm or decline."
          : "Your booked sessions with mentors."}
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {bookings === null ? (
        <div className="mt-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Icon name="calendar" className="h-6 w-6" />}
          title="No sessions yet"
          description={
            isMentor
              ? "When a student books time with you, the request will appear here."
              : "Find a mentor whose tags match your profile, then book a slot that suits you."
          }
          className="!py-14"
        />
      ) : (
        <>
          {section("Upcoming", upcoming, false)}
          {section("Past", past, true)}
        </>
      )}
    </div>
  );
}
