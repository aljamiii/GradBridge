// Route table with two layouts:
//   MarketingLayout — public pages (landing), top nav + footer
//   AppLayout       — everything behind auth, rendered inside the sidebar shell
// Auth pages (/login, /register) are full-bleed and use neither.
import { Routes, Route, Outlet } from "react-router-dom";
import MarketingNav from "./components/MarketingNav";
import AppShell from "./components/AppShell";
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
import Scholarships from "./pages/Scholarships";
import AdminScholarships from "./pages/AdminScholarships";
import SuccessPath from "./pages/SuccessPath";
import JobMarketPR from "./pages/JobMarketPR";
import EmailComposer from "./pages/EmailComposer";
import Connections from "./pages/Connections";
import { ConnectionsProvider } from "./components/Connect";
import { ToastProvider } from "./components/Toast";
import { NotificationsProvider } from "./components/Notifications";

const STUDENT = ["student"];
const MEMBERS = ["student", "mentor"];
const ADMIN = ["admin"];

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
    </Routes>
  );
}
