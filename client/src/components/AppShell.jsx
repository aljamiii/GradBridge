// The signed-in application layout: a persistent left sidebar + a topbar,
// with the routed page rendered in the scrolling content column.
// Marketing pages (/, /login, /register) use MarketingNav instead.
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { getSocket, disconnectSocket } from "../lib/socket";
import Icon from "./Icon";
import { useConnections } from "./Connect";
import NotificationBell from "./Notifications";
import { Avatar, cx } from "./ui";

/* ------------------------------------------------------------- nav config */

const NAV = {
  student: [
    {
      label: "Overview",
      items: [{ to: "/dashboard", icon: "home", label: "Dashboard" }],
    },
    {
      label: "Discover",
      items: [
        { to: "/universities", icon: "graduation", label: "Universities" },
        { to: "/scholarships", icon: "gift", label: "Scholarships" },
        { to: "/network-map", icon: "map", label: "Network Map" },
        { to: "/mentors", icon: "users", label: "Find a Mentor" },
        { to: "/success-path", icon: "trendingUp", label: "Success Paths" },
      ],
    },
    {
      label: "Planning tools",
      items: [
        { to: "/cost-predictor", icon: "wallet", label: "Cost Predictor" },
        { to: "/eligibility", icon: "target", label: "Eligibility Check" },
        { to: "/compatibility", icon: "puzzle", label: "Compatibility" },
        { to: "/financial-risk", icon: "trendingDown", label: "Risk & Savings" },
        { to: "/visa-checklist", icon: "passport", label: "Visa Checklist" },
        { to: "/job-pr", icon: "briefcase", label: "Jobs & PR Points" },
      ],
    },
    {
      label: "Outreach",
      items: [{ to: "/email-composer", icon: "message", label: "Email Composer" }],
    },
    {
      label: "Guidance",
      items: [
        { to: "/destination-advisor", icon: "globe", label: "Destination Advisor" },
        { to: "/survival-guide", icon: "compass", label: "Survival Guide" },
      ],
    },
    {
      label: "Community",
      items: [
        { to: "/forum", icon: "message", label: "Forum" },
        { to: "/forum/insights", icon: "chart", label: "Insights" },
      ],
    },
  ],
  mentor: [
    {
      label: "Overview",
      items: [{ to: "/dashboard", icon: "home", label: "Dashboard" }],
    },
    {
      label: "Mentoring",
      items: [
        { to: "/bookings", icon: "calendar", label: "Session requests" },
        { to: "/chat", icon: "message", label: "Messages", badge: "unread" },
        { to: "/connections", icon: "users", label: "My Network", badge: "requests" },
      ],
    },
    {
      label: "Community",
      items: [
        { to: "/forum", icon: "message", label: "Forum" },
        { to: "/forum/insights", icon: "chart", label: "Insights" },
        { to: "/scholarships", icon: "gift", label: "Scholarships" },
        { to: "/success-path", icon: "trendingUp", label: "Success Paths" },
      ],
    },
  ],
  admin: [
    {
      label: "Overview",
      items: [{ to: "/dashboard", icon: "home", label: "Dashboard" }],
    },
    {
      label: "Moderation",
      items: [
        { to: "/admin/mentors", icon: "shield", label: "Mentor applications" },
        { to: "/admin/scholarships", icon: "gift", label: "Scholarship review" },
      ],
    },
  ],
};

// Shown pinned at the bottom of the sidebar for students & mentors.
const PERSONAL = [
  { to: "/connections", icon: "users", label: "My Network", badge: "requests" },
  { to: "/bookings", icon: "calendar", label: "My Sessions" },
  { to: "/chat", icon: "message", label: "Chat", badge: "unread" },
];

/* -------------------------------------------------------------- sidebar */

function SidebarLink({ item, unread, requests, onNavigate }) {
  const count = item.badge === "unread" ? unread : item.badge === "requests" ? requests : 0;
  return (
    <NavLink
      to={item.to}
      end
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-ink-500 hover:bg-slate-100 hover:text-ink-900"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* active accent bar */}
          <span
            className={cx(
              "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-600 transition-opacity",
              isActive ? "opacity-100" : "opacity-0"
            )}
          />
          <Icon name={item.icon} className={cx("h-[18px] w-[18px] shrink-0", isActive && "text-brand-600")} />
          <span className="truncate">{item.label}</span>
          {count > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ user, unread, requests, onNavigate, onLogout }) {
  const groups = NAV[user.role] ?? NAV.student;
  const showPersonal = user.role === "student";

  return (
    <div className="flex h-full flex-col">
      {/* brand — goes to the public home page, not the dashboard */}
      <Link to="/" onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/50 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-brand)]">
          <Icon name="bridge" className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <span className="text-[15px] font-extrabold tracking-tight text-ink-900">
          Grad<span className="text-brand-600">Bridge</span>
        </span>
      </Link>

      {/* nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarLink key={item.to + item.label} item={item} unread={unread} requests={requests} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}

        {showPersonal && (
          <div>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
              Personal
            </p>
            <div className="space-y-0.5">
              {PERSONAL.map((item) => (
                <SidebarLink key={item.to} item={item} unread={unread} requests={requests} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* account */}
      <div className="shrink-0 border-t border-white/50 p-3">
        <Link to="/profile" onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100">
          <Avatar name={user.name} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink-900">{user.name}</span>
            <span className="block truncate text-xs capitalize text-ink-400">{user.role}</span>
          </span>
          <Icon name="settings" className="h-4 w-4 shrink-0 text-ink-400" />
        </Link>
        <button onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600">
          <Icon name="logout" className="h-[18px] w-[18px]" />
          Log out
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- shell */

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pendingCount } = useConnections();

  const refreshUnread = useCallback(() => {
    api("/api/chat/unread-count").then((d) => setUnread(d.count)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    refreshUnread();
    const socket = getSocket();
    socket?.on("inbox:update", refreshUnread);
    return () => socket?.off("inbox:update", refreshUnread);
  }, [user, refreshUnread]);

  // Navigating closes the mobile drawer.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate("/");
  };

  if (!user) return children;

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className="glass-panel fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
        <SidebarContent user={user} unread={unread} requests={pendingCount} onLogout={handleLogout} />
      </aside>

      {/* mobile drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/60 bg-white/90 shadow-2xl backdrop-blur-xl lg:hidden">
            <SidebarContent user={user} unread={unread} requests={pendingCount}
              onNavigate={() => setDrawerOpen(false)} onLogout={handleLogout} />
          </aside>
        </>
      )}

      {/* content column */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <Topbar user={user} unread={unread} requests={pendingCount}
          onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- topbar */

function Topbar({ user, unread, requests, onOpenDrawer }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cx(
        "glass sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 px-4 transition-shadow sm:px-6",
        scrolled ? "border-b border-slate-200/70 shadow-[0_1px_12px_rgb(15_23_42/0.05)]" : "border-b border-transparent"
      )}
    >
      <button onClick={onOpenDrawer} aria-label="Open menu"
        className="relative -ml-1 rounded-lg p-2 text-ink-700 transition-colors hover:bg-slate-100 lg:hidden">
        <Icon name="menu" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {/* brand shows on mobile where the sidebar is hidden */}
      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
          <Icon name="bridge" className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-sm font-extrabold tracking-tight text-ink-900">
          Grad<span className="text-brand-600">Bridge</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        <Link to="/chat" aria-label="Messages"
          className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-white/70 hover:text-ink-900">
          <Icon name="message" className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Link>
        <NotificationBell />
        <Link to="/profile" className="rounded-full p-0.5 transition-shadow hover:shadow-[var(--shadow-card)]">
          <Avatar name={user.name} size="sm" />
        </Link>
      </div>
    </header>
  );
}
