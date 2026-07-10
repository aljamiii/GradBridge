// Wraps any page that requires login (and optionally specific roles).
//   <ProtectedRoute> ... </ProtectedRoute>                → any logged-in user
//   <ProtectedRoute roles={["admin"]}> ... </ProtectedRoute> → admins only
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Logged in but wrong role → send to their own dashboard, not an error page.
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
