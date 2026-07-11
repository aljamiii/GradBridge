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
import DestinationAdvisor from "./pages/DestinationAdvisor";
import Mentors from "./pages/Mentors";
import Bookings from "./pages/Bookings";
import Chat from "./pages/Chat";
import NetworkMap from "./pages/NetworkMap";
import SurvivalGuide from "./pages/SurvivalGuide";
import Forum from "./pages/Forum";
import ForumInsights from "./pages/ForumInsights";
import Compatibility from "./pages/Compatibility";
import FinancialRisk from "./pages/FinancialRisk";
import VisaChecklist from "./pages/VisaChecklist";

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
        <Route
          path="/destination-advisor"
          element={
            <ProtectedRoute roles={["student"]}>
              <DestinationAdvisor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentors"
          element={
            <ProtectedRoute roles={["student"]}>
              <Mentors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network-map"
          element={
            <ProtectedRoute roles={["student"]}>
              <NetworkMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/survival-guide"
          element={
            <ProtectedRoute roles={["student"]}>
              <SurvivalGuide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum"
          element={
            <ProtectedRoute roles={["student", "mentor"]}>
              <Forum />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forum/insights"
          element={
            <ProtectedRoute roles={["student", "mentor"]}>
              <ForumInsights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/compatibility"
          element={
            <ProtectedRoute roles={["student"]}>
              <Compatibility />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial-risk"
          element={
            <ProtectedRoute roles={["student"]}>
              <FinancialRisk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/visa-checklist"
          element={
            <ProtectedRoute roles={["student"]}>
              <VisaChecklist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute roles={["student", "mentor"]}>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute roles={["student", "mentor"]}>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
