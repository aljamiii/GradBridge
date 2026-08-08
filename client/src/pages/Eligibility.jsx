import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";


const inputClass =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";


const VERDICTS = {
  eligible: {
    label: "Eligible",
    emoji: "✓",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    panel:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    icon:
      "bg-emerald-100 text-emerald-700",
  },

  borderline: {
    label: "Borderline",
    emoji: "!",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700",
    panel:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    icon:
      "bg-amber-100 text-amber-700",
  },

  "not-eligible": {
    label: "Not eligible yet",
    emoji: "×",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700",
    panel:
      "border-rose-200 bg-gradient-to-br from-rose-50 to-white",
    icon:
      "bg-rose-100 text-rose-700",
  },
};


const SEVERITY_BADGE = {
  critical:
    "bg-rose-50 text-rose-700 border-rose-200",

  moderate:
    "bg-amber-50 text-amber-700 border-amber-200",

  minor:
    "bg-slate-100 text-slate-600 border-slate-200",
};


export default function Eligibility() {
  const { user } = useAuth();

  const profile =
    user.studentProfile ?? {};


  const [form, setForm] = useState({
    university: "",

    program: profile.researchInterest
      ? `MSc in ${profile.researchInterest}`
      : "",

    degreeLevel: "Masters",
  });


  const [favorites, setFavorites] =
    useState([]);

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {
    api("/api/favorites")
      .then((data) =>
        setFavorites(
          data.favorites ?? []
        )
      )
      .catch(() => {});
  }, []);


  const profileIncomplete =
    profile.cgpa == null ||
    !profile.degree;


  const analyze = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await api(
        "/api/ai/eligibility",
        {
          method: "POST",
          body: form,
        }
      );

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to analyze your eligibility."
      );
    } finally {
      setLoading(false);
    }
  };


  const verdict =
    result &&
    (VERDICTS[result.verdict] ??
      VERDICTS.borderline);


  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* PAGE HEADER */}

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 sm:p-8">

        <div className="relative z-10 max-w-3xl">

          <span className="inline-flex rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Admission Readiness
          </span>


          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Eligibility & Gap Analyzer
          </h1>


          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Compare your academic profile
            against a target program&apos;s
            typical requirements and identify
            areas you may need to strengthen.
          </p>

        </div>


        <div className="pointer-events-none absolute -right-8 -top-12 hidden text-[145px] opacity-[0.06] sm:block">
          🎯
        </div>

      </section>


      {/* PROFILE SNAPSHOT */}

      <section
        className={`mt-6 rounded-2xl border p-5 shadow-sm ${
          profileIncomplete
            ? "border-amber-200 bg-amber-50/70"
            : "border-slate-200 bg-white"
        }`}
      >

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-4">

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                profileIncomplete
                  ? "bg-white"
                  : "bg-indigo-50"
              }`}
            >
              👤
            </div>


            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Profile used for analysis
              </p>


              {profileIncomplete ? (
                <>
                  <p className="mt-1 font-semibold text-amber-800">
                    Your academic profile is incomplete
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    Degree and CGPA are required
                    before GradBridge can run the
                    eligibility analysis.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 font-semibold text-slate-900">
                    {profile.degree}
                    {" · "}
                    CGPA {profile.cgpa}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.englishTest?.name &&
                    profile.englishTest.name !==
                      "None"
                      ? `${profile.englishTest.name} ${
                          profile.englishTest
                            .score ?? ""
                        }`
                      : "No English test added yet"}
                  </p>
                </>
              )}

            </div>

          </div>


          <Link
            to="/profile"
            className="inline-flex w-fit items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            Edit Profile
            <span className="ml-2">
              →
            </span>
          </Link>

        </div>

      </section>


      {/* MAIN AREA */}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">

        {/* FORM */}

        <form
          onSubmit={analyze}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              Target Program
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              What are you applying for?
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Enter a university and program
              to compare against your profile.
            </p>

          </div>


          {/* UNIVERSITY */}

          <div className="mt-6">

            <label
              htmlFor="eligibility-university"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              University
              <span className="ml-1 text-rose-500">
                *
              </span>
            </label>


            <input
              id="eligibility-university"
              value={form.university}
              required
              list="favorite-unis"
              onChange={(e) =>
                setForm({
                  ...form,
                  university:
                    e.target.value,
                })
              }
              placeholder="e.g. University of Toronto"
              className={inputClass}
            />


            <datalist id="favorite-unis">
              {favorites.map(
                (favorite) => (
                  <option
                    key={favorite._id}
                    value={favorite.name}
                  />
                )
              )}
            </datalist>


            {favorites.length > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                Saved universities may appear
                as suggestions while typing.
              </p>
            )}

          </div>


          {/* PROGRAM */}

          <div className="mt-5">

            <label
              htmlFor="eligibility-program"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Program
              <span className="ml-1 text-rose-500">
                *
              </span>
            </label>


            <input
              id="eligibility-program"
              value={form.program}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  program:
                    e.target.value,
                })
              }
              placeholder="e.g. MSc in Computer Science"
              className={inputClass}
            />

          </div>


          {/* LEVEL */}

          <div className="mt-6">

            <p className="mb-3 text-sm font-semibold text-slate-700">
              Degree level
            </p>


            <div className="grid grid-cols-2 gap-2">

              {["Masters", "PhD"].map(
                (level) => {
                  const selected =
                    form.degreeLevel ===
                    level;

                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() =>
                        setForm({
                          ...form,
                          degreeLevel:
                            level,
                        })
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-50"
                          : "border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                    >
                      {level}
                    </button>
                  );
                }
              )}

            </div>

          </div>


          {/* PROFILE WARNING */}

          {profileIncomplete && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">

              <p className="text-sm font-semibold text-amber-800">
                Complete your profile first
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                The analyzer needs your
                degree and CGPA before it can
                run.
              </p>

            </div>
          )}


          {/* BUTTON */}

          <button
            type="submit"
            disabled={
              loading ||
              profileIncomplete
            }
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
          >

            {loading ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                  />
                </svg>

                Analyzing...
              </>
            ) : (
              <>
                Analyze My Eligibility
                <span className="ml-2">
                  →
                </span>
              </>
            )}

          </button>

        </form>


        {/* RIGHT SIDE */}

        <div>

          {/* ERROR */}

          {error && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">

              <div className="flex gap-3">

                <div className="text-xl">
                  ⚠️
                </div>


                <div>

                  <p className="font-semibold text-rose-800">
                    Analysis failed
                  </p>

                  <p className="mt-1 text-sm leading-6 text-rose-700">
                    {error}
                  </p>

                </div>

              </div>

            </div>
          )}


          {/* EMPTY STATE */}

          {!result &&
            !loading && (
              <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                  🎯
                </div>


                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  Your eligibility result will appear here
                </h2>


                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Choose your target university,
                  program, and degree level to
                  compare your profile against
                  typical admission requirements.
                </p>

              </div>
            )}


          {/* LOADING */}

          {loading && (
            <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">

                <svg
                  className="h-7 w-7 animate-spin text-indigo-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />

                  <path
                    className="opacity-80"
                    fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                  />
                </svg>

              </div>


              <h2 className="mt-5 font-semibold text-slate-900">
                Comparing your profile
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Analyzing academic requirements
                and possible gaps...
              </p>

            </div>
          )}


          {/* VERDICT */}

          {result && (
            <div
              className={`overflow-hidden rounded-2xl border shadow-sm ${verdict.panel}`}
            >

              <div className="p-6">

                <div className="flex items-start gap-4">

                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${verdict.icon}`}
                  >
                    {
                      verdict.emoji
                    }
                  </div>


                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${verdict.badge}`}
                      >
                        {
                          verdict.label
                        }
                      </span>


                      {result.cached && (
                        <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs text-slate-500">
                          ⚡ Cached
                        </span>
                      )}

                    </div>


                    <h2 className="mt-4 text-xl font-bold leading-snug text-slate-900">
                      {
                        result.input
                          .degreeLevel
                      }{" "}
                      in{" "}
                      {
                        result.input
                          .program
                      }
                    </h2>


                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {
                        result.input
                          .university
                      }
                    </p>

                  </div>

                </div>


                <div className="mt-5 border-t border-slate-200/70 pt-5">

                  <p className="text-sm leading-7 text-slate-700">
                    {result.summary}
                  </p>

                </div>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* GAP ANALYSIS */}

      {result?.gaps?.length >
        0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

          <div className="flex flex-wrap items-end justify-between gap-3">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-600">
                Gap Analysis
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Areas to strengthen
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                These areas may affect your
                competitiveness or eligibility.
              </p>

            </div>


            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {
                result.gaps.length
              }{" "}
              {result.gaps.length ===
              1
                ? "gap"
                : "gaps"}
            </span>

          </div>


          <div className="mt-5 grid gap-4 lg:grid-cols-2">

            {result.gaps.map(
              (gap) => (

                <div
                  key={gap.area}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                >

                  <div className="flex flex-wrap items-center justify-between gap-2">

                    <h3 className="font-semibold text-slate-900">
                      {gap.area}
                    </h3>


                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${
                        SEVERITY_BADGE[
                          gap.severity
                        ] ??
                        SEVERITY_BADGE.minor
                      }`}
                    >
                      {
                        gap.severity
                      }
                    </span>

                  </div>


                  <div className="mt-4 space-y-3">

                    <div>

                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Typical requirement
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {
                          gap.requirement
                        }
                      </p>

                    </div>


                    <div>

                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Your status
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {
                          gap.yourStatus
                        }
                      </p>

                    </div>


                    <div className="rounded-lg bg-indigo-50 px-3 py-2.5">

                      <p className="text-xs font-semibold text-indigo-700">
                        Suggested next step
                      </p>

                      <p className="mt-1 text-sm leading-6 text-indigo-700">
                        {gap.advice}
                      </p>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </section>
      )}


      {/* STRENGTHS */}

      {result?.strengths?.length >
        0 && (
        <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 sm:p-6">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
              💪
            </div>


            <div className="flex-1">

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Your strengths
              </p>

              <h2 className="mt-1 font-semibold text-slate-900">
                What already works in your favor
              </h2>


              <div className="mt-4 grid gap-3 md:grid-cols-2">

                {result.strengths.map(
                  (strength) => (

                    <div
                      key={
                        strength
                      }
                      className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white p-4"
                    >

                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        ✓
                      </span>

                      <p className="text-sm leading-6 text-slate-600">
                        {
                          strength
                        }
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </section>
      )}


      {/* DISCLAIMER */}

      <div className="mt-5 rounded-xl bg-slate-100/70 px-4 py-3">

        <p className="text-xs leading-5 text-slate-500">
          This AI assessment is based on
          typical published requirements and
          should be used as guidance only.
          Always confirm current requirements
          on the program&apos;s official
          admissions page.
        </p>

      </div>

    </main>
  );
}