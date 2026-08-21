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

  const {
    stats,
    latestRun,
    recentScholarships,
  } = data;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ============================= */}
        {/* PAGE HEADER */}
        {/* ============================= */}

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Aggregator Dashboard
            </h1>

            <p className="mt-1 text-slate-500">
              Scholarship & Program Aggregation System
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* DUPLICATE RESOLUTION BUTTON */}
            <Link
              to="/admin/aggregator/duplicates"
              className="rounded-xl border border-indigo-600 px-5 py-3 font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              Resolve Duplicates
            </Link>

            {/* RUN SCRAPER BUTTON */}
            <button
              onClick={runAggregator}
              disabled={scraping}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scraping
                ? "Running Aggregator..."
                : "Run Aggregator Now"}
            </button>

          </div>
        </div>

        {/* ============================= */}
        {/* ERROR MESSAGE */}
        {/* ============================= */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* ============================= */}
        {/* STATISTICS */}
        {/* ============================= */}

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

        {/* ============================= */}
        {/* SYSTEM STATUS + LATEST RUN */}
        {/* ============================= */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* SYSTEM STATUS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-800">
              System Status
            </h2>

            <div className="mt-5 space-y-4 text-sm">

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Scraper
                </span>

                <span className="font-medium text-green-600">
                  Active
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Last synchronization
                </span>

                <span className="text-right font-medium text-slate-700">
                  {latestRun?.completedAt
                    ? new Date(
                        latestRun.completedAt
                      ).toLocaleString()
                    : "No recorded run"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">
                  Schedule
                </span>

                <span className="font-medium text-slate-700">
                  Daily at 06:00
                </span>
              </div>

            </div>

          </section>

          {/* LATEST AGGREGATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-semibold text-slate-800">
              Latest Aggregation
            </h2>

            {latestRun ? (
              <div className="mt-5 grid grid-cols-2 gap-4 text-center">

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-900">
                    {latestRun.totalFound}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Found
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-900">
                    {latestRun.totalAdded}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Added
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-900">
                    {latestRun.totalDuplicates}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Duplicates
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-slate-900">
                    {latestRun.totalFlagged}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
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

        {/* ============================= */}
        {/* RECENT UPDATES */}
        {/* ============================= */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <h2 className="text-lg font-semibold text-slate-800">
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

            {recentScholarships?.length > 0 ? (
              recentScholarships.map(
                (item) => (
                  <div
                    key={item._id}
                    className="py-4"
                  >
                    <p className="font-medium text-slate-800">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.provider || "Unknown provider"}
                      {" · "}
                      {item.country || "Unknown country"}
                      {" · "}
                      {item.status}
                    </p>
                  </div>
                )
              )
            ) : (
              <p className="py-6 text-sm text-slate-400">
                No recent scholarship updates.
              </p>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}