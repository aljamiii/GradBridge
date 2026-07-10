import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/"); // back to home after logging out
  };

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/" className="text-xl font-bold text-slate-800">
        Grad<span className="text-indigo-600">Bridge</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user.name} ·{" "}
              <span className="capitalize text-indigo-600">{user.role}</span>
            </span>
            <Link to="/dashboard" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
              Dashboard
            </Link>
            {user.role === "student" && (
              <>
                <Link to="/universities" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                  Universities
                </Link>
                <Link to="/cost-predictor" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                  Cost Predictor
                </Link>
                <Link to="/eligibility" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                  Eligibility
                </Link>
              </>
            )}
            <Link to="/profile" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
              Log in
            </Link>
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
