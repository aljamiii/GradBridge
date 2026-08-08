import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const TABS = ["pending", "approved", "rejected", "all"];

const statusBadge = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function MentorCard({ mentor, onDecide, busy }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink-900">{mentor.name}</h3>
          <p className="text-sm text-ink-500">
            {mentor.email}
            {mentor.phone ? ` · ${mentor.phone}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
            statusBadge[mentor.verificationStatus] ?? statusBadge.pending
          }`}
        >
          {mentor.verificationStatus}
        </span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="inline font-medium text-ink-500">Qualification: </dt>
          <dd className="inline text-ink-700">{mentor.qualification || "—"}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink-500">University: </dt>
          <dd className="inline text-ink-700">{mentor.university || "—"}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink-500">Expertise: </dt>
          <dd className="inline text-ink-700">
            {mentor.expertise?.length ? mentor.expertise.join(", ") : "—"}
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink-500">Availability: </dt>
          <dd className="inline text-ink-700">{mentor.availability || "—"}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        {mentor.verificationStatus !== "approved" && (
          <button
            onClick={() => onDecide(mentor.id, "approved")}
            disabled={busy}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            ✓ Approve
          </button>
        )}
        {mentor.verificationStatus !== "rejected" && (
          <button
            onClick={() => onDecide(mentor.id, "rejected")}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            ✕ Reject
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminMentors() {
  const [tab, setTab] = useState("pending");
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/admin/mentors?status=${tab}`);
      setMentors(data.mentors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, status) => {
    setBusy(true);
    try {
      await api(`/api/admin/mentors/${id}/status`, {
        method: "PUT",
        body: { status },
      });
      await load(); // refresh the list after the decision
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Mentor Verification</h1>
      <p className="mt-1 text-ink-500">
        Review mentor applications. Only approved mentors appear in student searches.
      </p>

      {/* Status tabs */}
      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="py-10 text-center text-ink-400">Loading…</p>
        ) : mentors.length === 0 ? (
          <p className="py-10 text-center text-ink-400">
            No {tab === "all" ? "" : tab} mentor applications.
          </p>
        ) : (
          mentors.map((m) => (
            <MentorCard key={m.id} mentor={m} onDecide={decide} busy={busy} />
          ))
        )}
      </div>
    </div>
  );
}
