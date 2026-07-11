import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { getSocket, disconnectSocket } from "../lib/socket";

const linkClass = "text-sm font-medium text-slate-700 hover:text-indigo-600";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    api("/api/chat/unread-count")
      .then((d) => setUnread(d.count))
      .catch(() => {});
  }, []);

  // Live unread badge: initial fetch + refresh on any inbox change.
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
                <Link to="/universities" className={linkClass}>Universities</Link>
                <Link to="/cost-predictor" className={linkClass}>Costs</Link>
                <Link to="/eligibility" className={linkClass}>Eligibility</Link>
                <Link to="/destination-advisor" className={linkClass}>Advisor</Link>
                <Link to="/mentors" className={linkClass}>Mentors</Link>
              </>
            )}
            {(user.role === "student" || user.role === "mentor") && (
              <>
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
