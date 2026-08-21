import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

function RecordCard({ title, record }) {
  if (!record) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <h3 className="text-lg font-semibold text-slate-900">
        {record.title || "Untitled scholarship"}
      </h3>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-800">Provider:</span>{" "}
          {record.provider || "Not available"}
        </p>

        <p>
          <span className="font-medium text-slate-800">Country:</span>{" "}
          {record.country || "Not available"}
        </p>

        <p>
          <span className="font-medium text-slate-800">Deadline:</span>{" "}
          {record.deadline || "Not available"}
        </p>

        <p>
          <span className="font-medium text-slate-800">Funding:</span>{" "}
          {record.fundingType || "Not available"}
        </p>

        <p>
          <span className="font-medium text-slate-800">Degree:</span>{" "}
          {record.degreeLevels?.length
            ? record.degreeLevels.join(", ")
            : "Not available"}
        </p>

        <div>
          <p className="font-medium text-slate-800">
            Eligibility:
          </p>

          <p className="mt-1 leading-6">
            {record.eligibility || "Not available"}
          </p>
        </div>

        {record.link && (
          <a
            href={record.link}
            target="_blank"
            rel="noreferrer"
            className="inline-block pt-2 font-medium text-indigo-600 hover:underline"
          >
            Open source
          </a>
        )}
      </div>
    </div>
  );
}

export default function DuplicateResolution() {
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadDuplicates = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const data = await api(
        "/api/admin/scholarships/duplicates?status=pending"
      );

      setDuplicates(data.duplicates || []);
    } catch (err) {
      setError(
        err.message || "Failed to load duplicate candidates."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDuplicates();
  }, [loadDuplicates]);

  const resolveDuplicate = async (id, action) => {
    try {
      setBusyId(id);
      setError("");

      if (action === "delete") {
        await api(
          `/api/admin/scholarships/duplicates/${id}`,
          {
            method: "DELETE",
          }
        );
      } else {
        await api(
          `/api/admin/scholarships/duplicates/${id}/${action}`,
          {
            method: "PUT",
          }
        );
      }

      await loadDuplicates();
    } catch (err) {
      setError(
        err.message || "Failed to resolve duplicate."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Duplicate Detection & Resolution
          </h1>

          <p className="mt-2 max-w-3xl text-slate-500">
            Review scholarship records detected as possible duplicates.
            Compare the existing database record with the newly scraped
            record, then merge them, keep both, or discard the duplicate.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8">

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading duplicate candidates...
            </div>
          ) : duplicates.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-800">
                No pending duplicates
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                The scraper has not detected any unresolved duplicate
                scholarship records.
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {duplicates.map((candidate) => {
                const similarity =
                  Math.round(
                    (candidate.similarityScore || 0) * 100
                  );

                const isBusy =
                  busyId === candidate._id;

                return (
                  <section
                    key={candidate._id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Possible duplicate detected
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3">

                          <span className="text-2xl font-bold text-slate-900">
                            {similarity}% Similar
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                              candidate.matchType === "exact"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {candidate.matchType || "unknown"} match
                          </span>

                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-400">
                        {candidate.detectedAt
                          ? new Date(
                              candidate.detectedAt
                            ).toLocaleString()
                          : ""}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">

                      <RecordCard
                        title="Existing Database Record"
                        record={candidate.originalScholarship}
                      />

                      <RecordCard
                        title="New Scraped Record"
                        record={candidate.candidateData}
                      />

                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-5">

                      <p className="mb-3 text-sm text-slate-500">
                        Choose how this duplicate should be handled:
                      </p>

                      <div className="flex flex-wrap gap-3">

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            resolveDuplicate(
                              candidate._id,
                              "merge"
                            )
                          }
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy
                            ? "Processing..."
                            : "Merge Records"}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            resolveDuplicate(
                              candidate._id,
                              "keep-both"
                            )
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Keep Both
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            resolveDuplicate(
                              candidate._id,
                              "delete"
                            )
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete Duplicate
                        </button>

                      </div>
                    </div>

                  </section>
                );
              })}

            </div>
          )}
        </div>

      </div>
    </main>
  );
}