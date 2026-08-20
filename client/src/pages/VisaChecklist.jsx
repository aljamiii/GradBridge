import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-xl border border-white/70 bg-white/60 backdrop-blur-sm px-3.5 py-2.5 text-ink-900 placeholder-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

const CATEGORY_META = {
  identity: { label: "Identity", emoji: "🪪" },
  academic: { label: "Academic", emoji: "🎓" },
  financial: { label: "Financial", emoji: "💰" },
  medical: { label: "Medical", emoji: "🩺" },
  "visa-forms": { label: "Visa Forms", emoji: "📋" },
};

const URGENCY_BADGE = {
  "start-now": { text: "start now", style: "bg-red-100 text-red-700" },
  "before-applying": { text: "before applying", style: "bg-amber-100 text-amber-700" },
  "after-admission": { text: "after admission", style: "bg-slate-100 text-slate-600" },
};

export default function VisaChecklist() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    country: user.studentProfile?.preferredCountry ?? "",
    degreeLevel: "Masters",
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Checked-off state lives in localStorage, keyed per country.
  const [checked, setChecked] = useState({});

  const storageKey = (country) => `gradbridge_visa_${country.toLowerCase()}`;

  const generate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/ai/visa-checklist", { method: "POST", body: form });
      setData(res);
      setChecked(JSON.parse(localStorage.getItem(storageKey(form.country)) ?? "{}"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (doc) => {
    const next = { ...checked, [doc]: !checked[doc] };
    setChecked(next);
    localStorage.setItem(storageKey(form.country), JSON.stringify(next));
  };

  const grouped = data
    ? Object.keys(CATEGORY_META)
        .map((cat) => ({ cat, items: data.items.filter((i) => i.category === cat) }))
        .filter((g) => g.items.length > 0)
    : [];

  const doneCount = data ? data.items.filter((i) => checked[i.document]).length : 0;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Visa & Document Checklist</h1>
      <p className="mt-1 text-ink-500">
        A personalized document list for Bangladeshi applicants — tick items off as
        you collect them.
      </p>

      <form onSubmit={generate}
        className="mt-6 flex flex-wrap items-end gap-3 glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
        <label className="min-w-48 flex-1">
          <span className="mb-1 block text-sm font-medium text-slate-600">Target country *</span>
          <input value={form.country} required
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="Canada" className={inputClass} />
        </label>
        <div className="flex gap-2">
          {["Masters", "PhD"].map((lvl) => (
            <button type="button" key={lvl}
              onClick={() => setForm({ ...form, degreeLevel: lvl })}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                form.degreeLevel === lvl
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}>
              {lvl}
            </button>
          ))}
        </div>
        <button type="submit" disabled={loading}
          className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white shadow-[var(--shadow-brand)] transition-all hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50">
          {loading ? "🤖 Building…" : "Generate checklist"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="mt-6 space-y-4">
          {/* Header card */}
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-brand-900">{data.visaType}</h2>
                <p className="text-sm text-brand-700">
                  Typical processing: {data.processingTimeWeeks} weeks · Nationality: Bangladeshi
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-brand-700">
                {doneCount}/{data.items.length} collected
              </span>
            </div>
          </div>

          {/* Grouped checklist */}
          {grouped.map(({ cat, items }) => (
            <div key={cat} className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
              </h3>
              <div className="mt-3 space-y-2">
                {items.map((item) => (
                  <label key={item.document}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50 ${
                      checked[item.document] ? "opacity-60" : ""
                    }`}>
                    <input type="checkbox" checked={!!checked[item.document]}
                      onChange={() => toggle(item.document)}
                      className="mt-1 h-4 w-4 rounded border-slate-300" />
                    <span className="flex-1">
                      <span className={`font-medium text-ink-900 ${checked[item.document] ? "line-through" : ""}`}>
                        {item.document}
                      </span>
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${URGENCY_BADGE[item.urgency]?.style}`}>
                        {URGENCY_BADGE[item.urgency]?.text}
                      </span>
                      <span className="block text-sm text-ink-500">{item.details}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Tips + reminder preview */}
          {data.tips?.length > 0 && (
            <div className="glass-card rounded-2xl p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                💡 Bangladesh-specific tips
              </h3>
              <ul className="mt-2 space-y-1.5">
                {data.tips.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
              📧 Reminder preview
            </h3>
            <p className="mt-2 text-sm italic text-slate-600">&ldquo;{data.reminderDraft}&rdquo;</p>
            <p className="mt-2 text-xs text-ink-400">
              Gemini-generated reminder draft — copy and use this reminder for your application deadline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
