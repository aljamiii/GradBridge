// AuthContext: one shared place that knows who is logged in.
// Any component can call useAuth() to get { user, login, register, logout }.
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking saved token

  // On first load: if a token is saved, ask the API who it belongs to.
  useEffect(() => {
    const token = localStorage.getItem("gradbridge_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("gradbridge_token")) // stale token
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem("gradbridge_token", data.token);
    setUser(data.user);
  };

  const register = async (form) => {
    const data = await api("/api/auth/register", { method: "POST", body: form });
    saveSession(data);
  };

  const login = async (form) => {
    const data = await api("/api/auth/login", { method: "POST", body: form });
    saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem("gradbridge_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// The hook pages actually use.
export const useAuth = () => useContext(AuthContext);
