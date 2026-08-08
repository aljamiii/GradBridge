import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// What an abroad student can offer newcomers — must match the User model enum.
const HELP_TOPICS = ["visa", "housing", "funding", "part-time jobs", "admissions", "settling in"];

// Shared input styling
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-ink-900 placeholder-slate-400 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

// A labelled field wrapper so the forms stay tidy.
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

// ---------- Student form (FR #3: academic + lifestyle preferences) ----------
function StudentForm({ user, onSave, saving }) {
  const p = user.studentProfile ?? {};
  const a = p.abroad ?? {};
  const [form, setForm] = useState({
    degree: p.degree ?? "",
    cgpa: p.cgpa ?? "",
    englishTestName: p.englishTest?.name ?? "None",
    englishTestScore: p.englishTest?.score ?? "",
    researchInterest: p.researchInterest ?? "",
    preferredCountry: p.preferredCountry ?? "",
    budgetUSD: p.budgetUSD ?? "",
    weatherTolerance: p.weatherTolerance ?? "no-preference",
    communityPriority: p.communityPriority ?? "medium",
    // Network map (for students already abroad)
    abroadOptIn: a.optIn ?? false,
    abroadCity: a.city ?? "",
    abroadCountry: a.country ?? "",
    abroadUniversity: a.university ?? "",
    abroadDegreeLevel: a.degreeLevel ?? "Masters",
    abroadSubject: a.subject ?? "",
    abroadHelpWith: a.helpWith ?? [],
  });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleHelp = (topic) =>
    setForm((f) => ({
      ...f,
      abroadHelpWith: f.abroadHelpWith.includes(topic)
        ? f.abroadHelpWith.filter((t) => t !== topic)
        : [...f.abroadHelpWith, topic],
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      studentProfile: {
        degree: form.degree,
        cgpa: form.cgpa === "" ? undefined : Number(form.cgpa),
        englishTest: {
          name: form.englishTestName,
          score: form.englishTestScore === "" ? undefined : Number(form.englishTestScore),
        },
        researchInterest: form.researchInterest,
        preferredCountry: form.preferredCountry,
        budgetUSD: form.budgetUSD === "" ? undefined : Number(form.budgetUSD),
        weatherTolerance: form.weatherTolerance,
        communityPriority: form.communityPriority,
        abroad: {
          optIn: form.abroadOptIn,
          city: form.abroadCity,
          country: form.abroadCountry,
          university: form.abroadUniversity,
          degreeLevel: form.abroadDegreeLevel,
          subject: form.abroadSubject,
          helpWith: form.abroadHelpWith,
        },
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
        Academic Profile
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Current/last degree">
          <input name="degree" value={form.degree} onChange={set}
            placeholder="BSc in CSE, BRAC University" className={inputClass} />
        </Field>
        <Field label="CGPA (out of 4)">
          <input name="cgpa" type="number" step="0.01" min="0" max="4"
            value={form.cgpa} onChange={set} placeholder="3.45" className={inputClass} />
        </Field>
        <Field label="English test">
          <select name="englishTestName" value={form.englishTestName} onChange={set} className={inputClass}>
            {["None", "IELTS", "TOEFL", "Duolingo"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Test score">
          <input name="englishTestScore" type="number" step="0.5" value={form.englishTestScore}
            onChange={set} placeholder="7.0" disabled={form.englishTestName === "None"}
            className={`${inputClass} disabled:bg-slate-100`} />
        </Field>
        <Field label="Research interest">
          <input name="researchInterest" value={form.researchInterest} onChange={set}
            placeholder="Machine Learning" className={inputClass} />
        </Field>
        <Field label="Preferred country">
          <input name="preferredCountry" value={form.preferredCountry} onChange={set}
            placeholder="Canada" className={inputClass} />
        </Field>
        <Field label="Yearly budget (USD)">
          <input name="budgetUSD" type="number" min="0" value={form.budgetUSD}
            onChange={set} placeholder="15000" className={inputClass} />
        </Field>
      </div>

      <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
        Lifestyle Preferences
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Weather tolerance">
          <select name="weatherTolerance" value={form.weatherTolerance} onChange={set} className={inputClass}>
            <option value="prefer-warm">I prefer warm places</option>
            <option value="prefer-cold">Cold doesn&apos;t bother me</option>
            <option value="no-preference">No preference</option>
          </select>
        </Field>
        <Field label="Community nearby (halal food, mosques, Bangladeshis)">
          <select name="communityPriority" value={form.communityPriority} onChange={set} className={inputClass}>
            <option value="high">Very important to me</option>
            <option value="medium">Nice to have</option>
            <option value="low">Not important</option>
          </select>
        </Field>
      </div>

      <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-ink-400">
        🗺️ Network Map
      </h2>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={form.abroadOptIn}
          onChange={(e) => setForm({ ...form, abroadOptIn: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300" />
        I&apos;m already studying abroad — show me on the network map so others can find me
      </label>
      {form.abroadOptIn && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <input name="abroadCity" value={form.abroadCity} onChange={set}
              placeholder="Toronto" className={inputClass} />
          </Field>
          <Field label="Country">
            <input name="abroadCountry" value={form.abroadCountry} onChange={set}
              placeholder="Canada" className={inputClass} />
          </Field>
          <Field label="University">
            <input name="abroadUniversity" value={form.abroadUniversity} onChange={set}
              placeholder="University of Toronto" className={inputClass} />
          </Field>
          <Field label="Degree level">
            <select name="abroadDegreeLevel" value={form.abroadDegreeLevel} onChange={set}
              className={inputClass}>
              {["Bachelors", "Masters", "PhD"].map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <input name="abroadSubject" value={form.abroadSubject} onChange={set}
              placeholder="Computer Science" className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-600">
              I can help newcomers with… (shown on your map card)
            </span>
            <div className="flex flex-wrap gap-2">
              {HELP_TOPICS.map((topic) => {
                const on = form.abroadHelpWith.includes(topic);
                return (
                  <button key={topic} type="button" onClick={() => toggleHelp(topic)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      on
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-300 bg-white text-ink-500 hover:border-amber-400"
                    }`}>
                    {on ? "✓ " : ""}{topic}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <button type="submit" disabled={saving}
        className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

// ---------- Mentor form (FR #3: expertise, availability, visibility) ----------
function MentorForm({ user, onSave, saving }) {
  const p = user.mentorProfile ?? {};
  const [form, setForm] = useState({
    qualification: p.qualification ?? "",
    university: p.university ?? "",
    expertise: (p.expertise ?? []).join(", "),
    availability: p.availability ?? "",
    isVisible: p.isVisible ?? true,
  });

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      mentorProfile: {
        qualification: form.qualification,
        university: form.university,
        // "SOP review, Canada visas" → ["SOP review", "Canada visas"]
        expertise: form.expertise.split(",").map((s) => s.trim()).filter(Boolean),
        availability: form.availability,
        isVisible: form.isVisible,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {p.verificationStatus === "approved" ? (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          ✅ Verified mentor — you appear in student searches.
        </div>
      ) : p.verificationStatus === "rejected" ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ Your application was rejected. Update your profile details and
          contact support if you believe this is a mistake.
        </div>
      ) : (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⏳ Your account is awaiting admin verification. You won&apos;t appear in
          student searches until approved.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qualification">
          <input name="qualification" value={form.qualification} onChange={set}
            placeholder="MSc in CS, University of Toronto" className={inputClass} />
        </Field>
        <Field label="Current university">
          <input name="university" value={form.university} onChange={set}
            placeholder="University of Toronto" className={inputClass} />
        </Field>
      </div>
      <Field label="Expertise (comma-separated)">
        <input name="expertise" value={form.expertise} onChange={set}
          placeholder="SOP review, Canada visas, Funding" className={inputClass} />
      </Field>
      <Field label="Availability">
        <input name="availability" value={form.availability} onChange={set}
          placeholder="Weekends, 8–10pm Bangladesh time" className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={form.isVisible}
          onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300" />
        Show my profile in student searches
      </label>

      <button type="submit" disabled={saving}
        className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

// ---------- The page ----------
export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok"|"error", text }

  const handleSave = async (payload) => {
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile(payload);
      setMessage({ type: "ok", text: "Profile saved ✔" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Your Profile</h1>
      <p className="mt-1 text-ink-500">
        {user.role === "student"
          ? "This information powers your AI cost estimates, eligibility checks, and compatibility scores."
          : "Students will see this when searching for mentors."}
      </p>

      {message && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            message.type === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[var(--shadow-card)]">
        {user.role === "mentor" ? (
          <MentorForm user={user} onSave={handleSave} saving={saving} />
        ) : (
          <StudentForm user={user} onSave={handleSave} saving={saving} />
        )}
      </div>
    </div>
  );
}
