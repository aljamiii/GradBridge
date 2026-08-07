import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const TABS = ["pending", "approved", "rejected", "all"];

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminScholarships() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(() => {
    api(`/api/admin/scholarships?status=${tab}`)
      .then((d) => setItems(d.scholarships))
      .catch((err) => setError(err.message));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, status) => {
    setBusy(true);
    try {
      await api(`/api/admin/scholarships/${id}/status`, { method: "PUT", body: { status } });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const startEdit = (scholarship) => {
    setEditingId(scholarship._id);

    setEditForm({
      title: scholarship.title || "",
      provider: scholarship.provider || "",
      country: scholarship.country || "",
      deadline: scholarship.deadline || "",
      fundingType: scholarship.fundingType || "unknown",
      eligibility: scholarship.eligibility || "",
      link: scholarship.link || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const saveEdit = async (id) => {
    setBusy(true);
    setError("");

    try {
      await api(`/api/admin/scholarships/${id}`, {
        method: "PUT",
        body: editForm,
      });

      setEditingId(null);
      setEditForm({});
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };



  const scrapeNow = async () => {
    setScraping(true);
    setReport(null);
    setError("");
    try {
      const d = await api("/api/admin/scholarships/scrape", { method: "POST" });
      setReport(d.report);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🛡️ Scholarship Data Review</h1>
          <p className="mt-1 text-slate-500">
            AI-flagged entries wait here for your decision. Clean entries are auto-approved.
          </p>
        </div>
        <button onClick={scrapeNow} disabled={scraping}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {scraping ? "🕷️ Scraping… (~30s)" : "🕷️ Run scraper now"}
        </button>
      </div>

      {/* Scrape report */}
      {report && (
        <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {report.map((r) => (
            <p key={r.source}>
              <strong>{r.source}:</strong>{" "}
              {r.error
                ? `❌ ${r.error}`
                : `found ${r.found}, added ${r.added} (${r.flagged} flagged), ${r.duplicates} duplicates skipped`}
            </p>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Tabs */}
      <div className="mt-5 flex gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {items === null ? (
          <p className="py-10 text-center text-slate-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-slate-400">Nothing {tab === "all" ? "" : tab} right now.</p>
        ) : (
          items.map((s) => (
            <div key={s._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {editingId === s._id ? (
            <div className="space-y-4">

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Program Title
                </label>

                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Provider
                  </label>

                  <input
                    name="provider"
                    value={editForm.provider}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Country
                  </label>

                  <input
                    name="country"
                    value={editForm.country}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Deadline
                  </label>

                  <input
                    name="deadline"
                    value={editForm.deadline}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Funding Type
                  </label>

                  <select
                    name="fundingType"
                    value={editForm.fundingType}
                    onChange={handleEditChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="full">Full</option>
                    <option value="partial">Partial</option>
                    <option value="varies">Varies</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Eligibility
                </label>

                <textarea
                  name="eligibility"
                  value={editForm.eligibility}
                  onChange={handleEditChange}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Source Link
                </label>

                <input
                  name="link"
                  value={editForm.link}
                  onChange={handleEditChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="flex gap-2">

                <button
                  onClick={() => saveEdit(s._id)}
                  disabled={busy}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Changes
                </button>

                <button
                  onClick={cancelEdit}
                  disabled={busy}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>

              </div>

            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">

                <h3 className="font-semibold text-slate-800">
                  {s.title}
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_BADGE[s.status]}`}
                >
                  {s.status}
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                {[
                  s.provider,
                  s.country,
                  s.deadline && `⏰ ${s.deadline}`,
                  s.fundingType,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              {(s.likelyOutdated || s.aiConfidence === "low") && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  🚩
                  {s.likelyOutdated && " Likely outdated."}
                  {s.aiConfidence === "low" &&
                    " Low extraction confidence."}
                  {s.flagReason && ` ${s.flagReason}`}
                </p>
              )}

              {s.eligibility && (
                <p className="mt-2 text-sm text-slate-600">
                  {s.eligibility}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">

                <button
                  onClick={() => startEdit(s)}
                  disabled={busy}
                  className="rounded-lg bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-50"
                >
                  ✏️ Edit
                </button>

                {s.status !== "approved" && (
                  <button
                    onClick={() => decide(s._id, "approved")}
                    disabled={busy}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                )}

                {s.status !== "rejected" && (
                  <button
                    onClick={() => decide(s._id, "rejected")}
                    disabled={busy}
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                )}

                {s.link && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-sm text-indigo-600 hover:underline"
                  >
                    source ↗
                  </a>
                )}

              </div>
            </>
          )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
