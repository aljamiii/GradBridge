// Route table with two layouts:
//   MarketingLayout — public pages (landing), top nav + footer
//   AppLayout       — everything behind auth, rendered inside the sidebar shell
// Auth pages (/login, /register) are full-bleed and use neither.
//
// Every page is code-split with lazy(). Previously all 26 pages plus Leaflet
// and its stylesheet were in the initial bundle, so a student who only opened
// the Cost Predictor still downloaded the whole mapping stack.
import { Suspense, lazy } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import MarketingNav from "./components/MarketingNav";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { ConnectionsProvider } from "./components/Connect";
import { ToastProvider } from "./components/Toast";
import { NotificationsProvider } from "./components/Notifications";

// Home is the landing page — the first thing a signed-out visitor sees, so it
// stays eager. Everything else loads on demand.
import Home from "./pages/Home";

const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminMentors = lazy(() => import("./pages/AdminMentors"));
const Universities = lazy(() => import("./pages/Universities"));
const CostPredictor = lazy(() => import("./pages/CostPredictor"));
const Eligibility = lazy(() => import("./pages/Eligibility"));
const DestinationAdvisor = lazy(() => import("./pages/DestinationAdvisor"));
const Mentors = lazy(() => import("./pages/Mentors"));
const Bookings = lazy(() => import("./pages/Bookings"));
const Chat = lazy(() => import("./pages/Chat"));
const NetworkMap = lazy(() => import("./pages/NetworkMap"));
const SurvivalGuide = lazy(() => import("./pages/SurvivalGuide"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumInsights = lazy(() => import("./pages/ForumInsights"));
const Compatibility = lazy(() => import("./pages/Compatibility"));
const FinancialRisk = lazy(() => import("./pages/FinancialRisk"));
const VisaChecklist = lazy(() => import("./pages/VisaChecklist"));
const Scholarships = lazy(() => import("./pages/Scholarships"));
const AdminScholarships = lazy(() => import("./pages/AdminScholarships"));
const SuccessPath = lazy(() => import("./pages/SuccessPath"));
const JobMarketPR = lazy(() => import("./pages/JobMarketPR"));
const EmailComposer = lazy(() => import("./pages/EmailComposer"));
const Connections = lazy(() => import("./pages/Connections"));
const NotFound = lazy(() => import("./pages/NotFound"));

const STUDENT = ["student"];
const MEMBERS = ["student", "mentor"];
const ADMIN = ["admin"];

// Shown while a route chunk is in flight. Deliberately quiet — a chunk fetch
// on a warm connection is usually imperceptible, and a spinner that flashes
// for 80ms is worse than nothing.
function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24" role="status">
      <span className="sr-only">Loading page</span>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  );
}

function MarketingLayout() {
  return (
    <div className="bg-app flex min-h-screen flex-col">
      <MarketingNav />
      <Outlet />
    </div>
  );
}

// Every signed-in page: sidebar shell + soft app background.
function AppLayout() {
  return (
    // Toast must wrap Notifications (live notifications raise toasts), and
    // Connections wraps the shell so the sidebar badge and every Connect
    // button on the page share one status store.
    <ToastProvider>
      <NotificationsProvider>
        <ConnectionsProvider>
          <div className="bg-app min-h-screen">
            <AppShell>
              <Outlet />
            </AppShell>
          </div>
        </ConnectionsProvider>
      </NotificationsProvider>
    </ToastProvider>
  );
}

// Small helper so the route table stays readable.
const guarded = (element, roles) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* public */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* auth — full-bleed split screen, no chrome */}
        <Route path="/login" element={<div className="bg-app flex min-h-screen"><Login /></div>} />
        <Route path="/register" element={<div className="bg-app flex min-h-screen"><Register /></div>} />

        {/* application */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={guarded(<Dashboard />)} />
          <Route path="/profile" element={guarded(<Profile />)} />

          <Route path="/universities" element={guarded(<Universities />, STUDENT)} />
          <Route path="/cost-predictor" element={guarded(<CostPredictor />, STUDENT)} />
          <Route path="/eligibility" element={guarded(<Eligibility />, STUDENT)} />
          <Route path="/destination-advisor" element={guarded(<DestinationAdvisor />, STUDENT)} />
          <Route path="/mentors" element={guarded(<Mentors />, STUDENT)} />
          <Route path="/network-map" element={guarded(<NetworkMap />, STUDENT)} />
          <Route path="/survival-guide" element={guarded(<SurvivalGuide />, STUDENT)} />
          <Route path="/compatibility" element={guarded(<Compatibility />, STUDENT)} />
          <Route path="/financial-risk" element={guarded(<FinancialRisk />, STUDENT)} />
          <Route path="/visa-checklist" element={guarded(<VisaChecklist />, STUDENT)} />
          <Route path="/job-pr" element={guarded(<JobMarketPR />, STUDENT)} />
          <Route path="/email-composer" element={guarded(<EmailComposer />, STUDENT)} />

          <Route path="/forum" element={guarded(<Forum />, MEMBERS)} />
          <Route path="/forum/insights" element={guarded(<ForumInsights />, MEMBERS)} />
          <Route path="/scholarships" element={guarded(<Scholarships />, MEMBERS)} />
          <Route path="/success-path" element={guarded(<SuccessPath />, MEMBERS)} />
          <Route path="/bookings" element={guarded(<Bookings />, MEMBERS)} />
          <Route path="/chat" element={guarded(<Chat />, MEMBERS)} />
          <Route path="/connections" element={guarded(<Connections />, MEMBERS)} />

          <Route path="/admin/mentors" element={guarded(<AdminMentors />, ADMIN)} />
          <Route path="/admin/scholarships" element={guarded(<AdminScholarships />, ADMIN)} />
        </Route>

        {/* anything else — previously rendered a blank page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
