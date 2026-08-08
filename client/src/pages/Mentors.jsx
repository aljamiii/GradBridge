import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

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
    <form onSubmit={book} className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4">
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

function MentorCard({ mentor }) {
  const [showBooking, setShowBooking] = useState(false);
  const navigate = useNavigate();

  const openChat = async () => {
    const data = await api("/api/chat/start", {
      method: "POST",
      body: { userId: mentor.id },
    });
    navigate(`/chat?c=${data.conversationId}`);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink-900">{mentor.name}</h3>
          <p className="text-sm text-ink-500">
            {mentor.qualification}
            {mentor.university && ` · ${mentor.university}`}
          </p>
        </div>
        {mentor.matchScore > 0 && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
            title={`Matched on: ${mentor.matchedOn.join(", ")}`}>
            🎯 {mentor.matchScore} match{mentor.matchScore > 1 ? "es" : ""}
          </span>
        )}
      </div>

      {mentor.expertise?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {mentor.expertise.map((tag) => (
            <span key={tag}
              className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700">
              {tag}
            </span>
          ))}
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
          💬 Message
        </button>
      </div>

      {showBooking && <BookingForm mentor={mentor} />}
    </div>
  );
}

export default function Mentors() {
  const [mentors, setMentors] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/mentors")
      .then((data) => setMentors(data.mentors))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Find a Mentor</h1>
      <p className="mt-1 text-ink-500">
        Verified mentors, ranked by how well they match your profile (country,
        research interest, background).
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 space-y-4">
        {mentors === null ? (
          <p className="py-10 text-center text-ink-400">Loading mentors…</p>
        ) : mentors.length === 0 ? (
          <p className="py-10 text-center text-ink-400">
            No approved mentors yet — check back soon.
          </p>
        ) : (
          mentors.map((m) => <MentorCard key={m.id} mentor={m} />)
        )}
      </div>
    </div>
  );
}
