import { useEffect, useState } from "react";

// A small status chip: green when good, amber when waiting/missing.
function StatusChip({ ok, okText, badText }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${
        ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {ok ? okText : badText}
    </span>
  );
}

export default function App() {
  const [health, setHealth] = useState(null); // API response
  const [error, setError] = useState(false); // couldn't reach API at all

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-4xl font-bold text-slate-800">
        Grad<span className="text-indigo-600">Bridge</span>
      </h1>
      <p className="mt-2 max-w-md text-center text-slate-500">
        AI-Powered Study Abroad Decision &amp; Life Readiness Platform
      </p>

      <div className="mt-8 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          System Status
        </h2>
        <div className="flex items-center justify-between py-2">
          <span className="text-slate-700">API Server</span>
          <StatusChip
            ok={!!health}
            okText="Running"
            badText={error ? "Not reachable" : "Checking…"}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-slate-700">Database</span>
          <StatusChip
            ok={health?.database === "connected"}
            okText="Connected"
            badText="Not connected"
          />
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Phase 1 · Project Skeleton · MVC
      </p>
    </div>
  );
}
