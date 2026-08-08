import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import { Badge, Button, Card, CardTitle, Page, PageHeader, Stat, cx } from "../components/ui";

/* ---------------------------------------------------------------- content */

const STUDENT_ACTIONS = [
  { to: "/cost-predictor", icon: "wallet", label: "Predict my costs", desc: "First-year budget in USD + BDT" },
  { to: "/eligibility", icon: "target", label: "Check eligibility", desc: "Gaps against a program" },
  { to: "/scholarships", icon: "gift", label: "Find scholarships", desc: "Scraped and reviewed daily" },
  { to: "/network-map", icon: "map", label: "Open network map", desc: "Students already abroad" },
  { to: "/mentors", icon: "users", label: "Match a mentor", desc: "Ranked by shared tags" },
  { to: "/visa-checklist", icon: "passport", label: "Build visa checklist", desc: "Documents and timing" },
];

const MENTOR_ACTIONS = [
  { to: "/bookings", icon: "calendar", label: "Session requests", desc: "Confirm or decline" },
  { to: "/chat", icon: "message", label: "Messages", desc: "Students waiting on you" },
  { to: "/forum", icon: "users", label: "Community forum", desc: "Answer open questions" },
  { to: "/profile", icon: "settings", label: "Expertise & availability", desc: "Keep your profile current" },
];

const ADMIN_ACTIONS = [
  { to: "/admin/mentors", icon: "shield", label: "Mentor applications", desc: "Approve or reject" },
  { to: "/admin/scholarships", icon: "gift", label: "Scholarship review", desc: "Check scraped entries" },
];

// Profile fields that make the rest of the platform work.
const PROFILE_CHECKS = [
  { key: "degree", label: "Degree" },
  { key: "cgpa", label: "CGPA" },
  { key: "preferredCountry", label: "Target country" },
  { key: "budgetUSD", label: "Budget" },
  { key: "researchInterest", label: "Research interest" },
];

/* ------------------------------------------------------------------- page */

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ unread: null, bookings: null, favorites: null });

  useEffect(() => {
    if (user.role === "admin") return;
    Promise.allSettled([
      api("/api/chat/unread-count"),
      api("/api/bookings"),
      api("/api/favorites"),
    ]).then(([unread, bookings, favorites]) => {
      setStats({
        unread: unread.value?.count ?? 0,
        bookings: bookings.value?.bookings?.filter((b) => b.status === "pending" || b.status === "confirmed").length ?? 0,
        favorites: favorites.value?.favorites?.length ?? 0,
      });
    });
  }, [user.role]);

  const profile = user.studentProfile ?? {};
  const done = PROFILE_CHECKS.filter((c) => profile[c.key] != null && profile[c.key] !== "");
  const pct = Math.round((done.length / PROFILE_CHECKS.length) * 100);

  const actions =
    user.role === "admin" ? ADMIN_ACTIONS : user.role === "mentor" ? MENTOR_ACTIONS : STUDENT_ACTIONS;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  })();

  return (
    <Page width="6xl">
      <PageHeader
        eyebrow={`${user.role} dashboard`}
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description={
          user.role === "student"
            ? "Here's where you stand and what's worth doing next."
            : user.role === "mentor"
              ? "Students are counting on your replies — here's what's waiting."
              : "Platform moderation and data review."
        }
        actions={
          user.role === "student" && pct < 100 ? (
            <Button to="/profile" variant="secondary">Complete profile</Button>
          ) : null
        }
      />

      {/* Stats */}
      {user.role !== "admin" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={<Icon name="message" />} tone="brand" label="Unread messages"
            value={stats.unread ?? "—"}
            hint={stats.unread ? "Someone is waiting on you" : "You're all caught up"} />
          <Stat icon={<Icon name="calendar" />} tone="green" label="Active sessions"
            value={stats.bookings ?? "—"}
            hint={stats.bookings ? "Pending or confirmed" : "No sessions booked yet"} />
          <Stat icon={<Icon name="star" />} tone="amber" label="Saved universities"
            value={stats.favorites ?? "—"}
            hint={stats.favorites ? "In your shortlist" : "Star some from Universities"} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <Card className="lg:col-span-2">
          <CardTitle>Jump back in</CardTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {actions.map((a) => (
              <Link key={a.to} to={a.to}
                className="group flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink-500 transition-colors group-hover:bg-white group-hover:text-brand-600">
                  <Icon name={a.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink-900">{a.label}</span>
                  <span className="block truncate text-xs text-ink-400">{a.desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Profile completeness — students only */}
        {user.role === "student" ? (
          <Card>
            <CardTitle right={<Badge tone={pct === 100 ? "green" : "amber"}>{pct}%</Badge>}>
              Profile strength
            </CardTitle>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cx("h-full rounded-full transition-all duration-700",
                  pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-brand-500 to-brand-600")}
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-400">
              {pct === 100
                ? "Everything's filled in — every tool is running on your real numbers."
                : "The predictors, eligibility check and compatibility score all read these fields."}
            </p>

            <ul className="mt-4 space-y-2">
              {PROFILE_CHECKS.map((c) => {
                const ok = profile[c.key] != null && profile[c.key] !== "";
                return (
                  <li key={c.key} className="flex items-center gap-2.5 text-sm">
                    <span className={cx(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-ink-400"
                    )}>
                      {ok ? "✓" : "○"}
                    </span>
                    <span className={ok ? "text-ink-500" : "text-ink-400"}>{c.label}</span>
                  </li>
                );
              })}
            </ul>

            {pct < 100 && (
              <Button to="/profile" variant="subtle" size="sm" className="mt-5 w-full">
                Finish your profile →
              </Button>
            )}
          </Card>
        ) : (
          <Card>
            <CardTitle>Your account</CardTitle>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Name</dt>
                <dd className="truncate font-medium text-ink-900">{user.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-400">Role</dt>
                <dd className="font-medium capitalize text-ink-900">{user.role}</dd>
              </div>
              {user.role === "mentor" && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-400">Verification</dt>
                  <dd>
                    <Badge tone={user.mentorProfile?.verificationStatus === "approved" ? "green" : "amber"}>
                      {user.mentorProfile?.verificationStatus ?? "pending"}
                    </Badge>
                  </dd>
                </div>
              )}
            </dl>
            <Button to="/profile" variant="subtle" size="sm" className="mt-5 w-full">
              Edit profile →
            </Button>
          </Card>
        )}
      </div>
    </Page>
  );
}
