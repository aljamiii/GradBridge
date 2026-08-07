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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-800">{s.title}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_BADGE[s.status]}`}>
                  {s.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {[s.provider, s.country, s.deadline && `⏰ ${s.deadline}`, s.fundingType]
                  .filter(Boolean).join(" · ")}
              </p>

              {/* Why the AI flagged it */}
              {(s.likelyOutdated || s.aiConfidence === "low") && (
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  🚩 {s.likelyOutdated && "Likely outdated. "}
                  {s.aiConfidence === "low" && "Low extraction confidence. "}
                  {s.flagReason}
                </p>
              )}

              {s.eligibility && <p className="mt-2 text-sm text-slate-600">{s.eligibility}</p>}

              <div className="mt-3 flex items-center gap-2">
                {s.status !== "approved" && (
                  <button onClick={() => decide(s._id, "approved")} disabled={busy}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                    ✓ Approve
                  </button>
                )}
                {s.status !== "rejected" && (
                  <button onClick={() => decide(s._id, "rejected")} disabled={busy}
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                    ✕ Reject
                  </button>
                )}
                {s.link && (
                  <a href={s.link} target="_blank" rel="noreferrer"
                    className="ml-auto text-sm text-indigo-600 hover:underline">
                    source ↗
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
