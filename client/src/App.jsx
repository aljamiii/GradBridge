// App is now just the route table — each page lives in src/pages.
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import AdminMentors from "./pages/AdminMentors";
import Universities from "./pages/Universities";
import CostPredictor from "./pages/CostPredictor";
import Eligibility from "./pages/Eligibility";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentors"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminMentors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/universities"
          element={
            <ProtectedRoute roles={["student"]}>
              <Universities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cost-predictor"
          element={
            <ProtectedRoute roles={["student"]}>
              <CostPredictor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eligibility"
          element={
            <ProtectedRoute roles={["student"]}>
              <Eligibility />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
