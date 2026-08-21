import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

// Verdict banner styling per outcome.
const VERDICTS = {
  eligible: {
    style: "bg-green-50 border-green-200 text-green-800",
    emoji: "✅",
    label: "Eligible",
  },
  borderline: {
    style: "bg-amber-50 border-amber-200 text-amber-800",
    emoji: "⚖️",
    label: "Borderline",
  },
  "not-eligible": {
    style: "bg-red-50 border-red-200 text-red-800",
    emoji: "❌",
    label: "Not eligible yet",
  },
};

const SEVERITY_BADGE = {
  critical: "bg-red-100 text-red-700",
  moderate: "bg-amber-100 text-amber-700",
  minor: "bg-slate-100 text-slate-600",
};

export default function Eligibility() {
  const { user } = useAuth();
  const p = user.studentProfile ?? {};

  const [form, setForm] = useState({
    university: "",
    program: p.researchInterest ? `MSc in ${p.researchInterest}` : "",
    degreeLevel: "Masters",
  });
  const [favorites, setFavorites] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Saved favorites become one-click suggestions for the university field.
  useEffect(() => {
    api("/api/favorites")
      .then((data) => setFavorites(data.favorites))
      .catch(() => {}); // suggestions are optional — fail silently
  }, []);

  const profileIncomplete = p.cgpa == null || !p.degree;

  const analyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api("/api/ai/eligibility", { method: "POST", body: form });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verdict = result && (VERDICTS[result.verdict] ?? VERDICTS.borderline);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Eligibility & Gap Analyzer</h1>
      <p className="mt-1 text-ink-500">
        An honest AI check of your profile against a program&apos;s typical requirements.
      </p>

      {/* Profile snapshot the analysis will use */}
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-slate-600">
            <span className="font-semibold text-ink-400 uppercase tracking-wide text-xs">
              Your profile:{" "}
            </span>
            {profileIncomplete ? (
              <span className="text-amber-700">
                incomplete — degree and CGPA are required for analysis
              </span>
            ) : (
              <>
                {p.degree} · CGPA {p.cgpa}
                {p.englishTest?.name && p.englishTest.name !== "None"
                  ? ` · ${p.englishTest.name} ${p.englishTest.score ?? ""}`
                  : " · no English test yet"}
              </>
            )}
          </div>
          <Link to="/profile" className="font-medium text-brand-600 hover:underline">
            Edit profile
          </Link>
        </div>
      </div>

      {/* Target program form */}
      <form onSubmit={analyze}
        className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">University *</span>
            <input value={form.university} required list="favorite-unis"
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              placeholder="University of Toronto" className={inputClass} />
            {/* datalist = native autocomplete from saved favorites */}
            <datalist id="favorite-unis">
              {favorites.map((f) => (
                <option key={f._id} value={f.name} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">Program *</span>
            <input value={form.program} required
              onChange={(e) => setForm({ ...form, program: e.target.value })}
              placeholder="MSc in Computer Science" className={inputClass} />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
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
          <button type="submit" disabled={loading || profileIncomplete}
            className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {loading ? "🤖 Analyzing…" : "Analyze my eligibility"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Verdict banner */}
          <div className={`rounded-xl border p-5 ${verdict.style}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {verdict.emoji} {verdict.label} — {result.input.degreeLevel} in{" "}
                {result.input.program}, {result.input.university}
              </h2>
              {result.cached && <span className="text-xs opacity-60">⚡ cached</span>}
            </div>
            <p className="mt-2 text-sm">{result.summary}</p>
          </div>

          {/* Gaps */}
          {result.gaps?.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                What&apos;s missing ({result.gaps.length})
              </h3>
              <div className="mt-3 space-y-4">
                {result.gaps.map((g) => (
                  <div key={g.area} className="border-l-2 border-slate-200 pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink-900">{g.area}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        SEVERITY_BADGE[g.severity] ?? SEVERITY_BADGE.minor
                      }`}>
                        {g.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      Typically required: <span className="text-ink-700">{g.requirement}</span>
                      {" · "}You: <span className="text-ink-700">{g.yourStatus}</span>
                    </p>
                    <p className="mt-1 text-sm text-brand-700">→ {g.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
                💪 Your strengths
              </h3>
              <ul className="mt-2 space-y-1.5">
                {result.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-ink-400">
            AI assessment based on typical published requirements — always confirm on the
            program&apos;s official admissions page.
          </p>
        </div>
      )}
    </div>
  );
}
