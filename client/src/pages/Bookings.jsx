import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-ink-500",
};

export default function Bookings() {
  const { user } = useAuth();
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

  const isMentor = user.role === "mentor";

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">My Sessions</h1>
      <p className="mt-1 text-ink-500">
        {isMentor
          ? "Session requests from students — confirm or decline."
          : "Your booked sessions with mentors."}
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 space-y-4">
        {bookings === null ? (
          <p className="py-10 text-center text-ink-400">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="py-10 text-center text-ink-400">
            No sessions yet{isMentor ? "." : " — find a mentor and book one!"}
          </p>
        ) : (
          bookings.map((b) => (
            <div key={b._id} className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-ink-900">
                    {isMentor ? b.student?.name : b.mentor?.name}
                  </h3>
                  <p className="text-sm text-ink-500">
                    {new Date(b.start).toLocaleString()} · {b.durationMins} min
                  </p>
                  {b.topic && <p className="mt-1 text-sm text-slate-600">📝 {b.topic}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  STATUS_BADGE[b.status]
                }`}>
                  {b.status}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                {isMentor && b.status === "pending" && (
                  <>
                    <button onClick={() => setStatus(b._id, "confirmed")} disabled={busy}
                      className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                      ✓ Confirm
                    </button>
                    <button onClick={() => setStatus(b._id, "declined")} disabled={busy}
                      className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                      ✕ Decline
                    </button>
                  </>
                )}
                {!isMentor && ["pending", "confirmed"].includes(b.status) && (
                  <button onClick={() => setStatus(b._id, "cancelled")} disabled={busy}
                    className="rounded-lg bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50">
                    Cancel session
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
