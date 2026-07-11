import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { getSocket, disconnectSocket } from "../lib/socket";

const linkClass = "text-sm font-medium text-slate-700 hover:text-indigo-600";

// A small dropdown menu: click to open, click anywhere else to close.
function Menu({ label, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className={`${linkClass} flex items-center gap-1`}>
        {label} <span className="text-xs">▾</span>
      </button>
      {open && (
        <>
          {/* invisible backdrop: any outside click closes the menu */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-20 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
            {items.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700">
                {item.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const EXPLORE_ITEMS = [
  { to: "/universities", label: "🎓 Universities" },
  { to: "/scholarships", label: "🎁 Scholarships" },
  { to: "/success-path", label: "📈 Success Paths" },
  { to: "/network-map", label: "🗺️ Network Map" },
  { to: "/survival-guide", label: "🧭 Survival Guide" },
  { to: "/mentors", label: "🧑‍🏫 Find a Mentor" },
];

const TOOLS_ITEMS = [
  { to: "/cost-predictor", label: "💰 Cost Predictor" },
  { to: "/eligibility", label: "🎯 Eligibility Check" },
  { to: "/destination-advisor", label: "🌍 Destination Advisor" },
  { to: "/compatibility", label: "🧩 Compatibility Score" },
  { to: "/financial-risk", label: "📉 Risk & Savings" },
  { to: "/visa-checklist", label: "🛂 Visa Checklist" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    api("/api/chat/unread-count")
      .then((d) => setUnread(d.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    refreshUnread();
    const socket = getSocket();
    socket?.on("inbox:update", refreshUnread);
    return () => socket?.off("inbox:update", refreshUnread);
  }, [user, refreshUnread]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/");
  };

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/" className="text-xl font-bold text-slate-800">
        Grad<span className="text-indigo-600">Bridge</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/dashboard" className={linkClass}>Dashboard</Link>
            {user.role === "student" && (
              <>
                <Menu label="Explore" items={EXPLORE_ITEMS} />
                <Menu label="Tools" items={TOOLS_ITEMS} />
              </>
            )}
            {(user.role === "student" || user.role === "mentor") && (
              <>
                <Link to="/forum" className={linkClass}>Forum</Link>
                <Link to="/bookings" className={linkClass}>Sessions</Link>
                <Link to="/chat" className={`${linkClass} relative`}>
                  Chat
                  {unread > 0 && (
                    <span className="absolute -right-3 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              </>
            )}
            <Link to="/profile" className={linkClass}>Profile</Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={linkClass}>Log in</Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
