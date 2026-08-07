import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-800">
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default function AggregatorDashboard() {
  const [data, setData] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      const result = await api(
        "/api/admin/scholarships/dashboard"
      );

      setData(result);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const runAggregator = async () => {
    try {
      setScraping(true);
      setError("");

      await api(
        "/api/admin/scholarships/scrape",
        {
          method: "POST",
        }
      );

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setScraping(false);
    }
  };

  if (!data) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading aggregator dashboard...
      </div>
    );
  }

  const { stats, latestRun, recentScholarships } = data;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                Aggregator Dashboard
                </h1>

                <p className="mt-1 text-slate-500">
                Scholarship & Program Aggregation System
                </p>
            </div>

            <button
                onClick={runAggregator}
                disabled={scraping}
                className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
                {scraping
                ? "Running Aggregator..."
                : "Run Aggregator Now"}
            </button>

        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Programs"
            value={stats.totalPrograms}
            subtitle="Stored opportunities"
          />

          <StatCard
            title="Published"
            value={stats.approved}
            subtitle="Visible to students"
          />

          <StatCard
            title="AI Flag Records"
            value={stats.pending}
            subtitle="Require administrator review"
          />

          <StatCard
            title="Outdated"
            value={stats.outdated}
            subtitle="Potentially expired entries"
          />

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-800">
              System Status
            </h2>

            <div className="mt-5 space-y-4 text-sm">

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Scraper
                </span>
                <span className="font-medium text-green-600">
                  Active
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Last synchronization
                </span>

                <span className="font-medium text-slate-700">
                  {latestRun?.completedAt
                    ? new Date(
                        latestRun.completedAt
                      ).toLocaleString()
                    : "No recorded run"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Schedule
                </span>

                <span className="font-medium text-slate-700">
                  Daily at 06:00
                </span>
              </div>

            </div>

          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-800">
              Latest Aggregation
            </h2>

            {latestRun ? (
              <div className="mt-5 grid grid-cols-2 gap-4 text-center">

                <div>
                  <p className="text-2xl font-bold">
                    {latestRun.totalFound}
                  </p>
                  <p className="text-xs text-slate-500">
                    Found
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-bold">
                    {latestRun.totalAdded}
                  </p>
                  <p className="text-xs text-slate-500">
                    Added
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-bold">
                    {latestRun.totalDuplicates}
                  </p>
                  <p className="text-xs text-slate-500">
                    Duplicates
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-bold">
                    {latestRun.totalFlagged}
                  </p>
                  <p className="text-xs text-slate-500">
                    Flagged
                  </p>
                </div>

              </div>
            ) : (
              <p className="mt-5 text-slate-400">
                No aggregation has been recorded yet.
              </p>
            )}

          </section>

        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-semibold">
              Recent Updates
            </h2>

            <Link
              to="/admin/scholarships"
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Review AI Flags
            </Link>

          </div>

          <div className="mt-4 divide-y divide-slate-100">

            {recentScholarships.map((item) => (
              <div
                key={item._id}
                className="py-4"
              >
                <p className="font-medium text-slate-800">
                  {item.title}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {item.provider} · {item.country} · {item.status}
                </p>
              </div>
            ))}

          </div>

        </section>

      </div>
    </main>
  );
}