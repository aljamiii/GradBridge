import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

export default function Home() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="text-4xl font-bold text-slate-800">
        Grad<span className="text-indigo-600">Bridge</span>
      </h1>
      <p className="mt-2 max-w-md text-center text-slate-500">
        AI-Powered Study Abroad Decision &amp; Life Readiness Platform
      </p>

      {!user && (
        <Link
          to="/register"
          className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
        >
          Get started — it&apos;s free
        </Link>
      )}

      <div className="mt-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
    </div>
  );
}
