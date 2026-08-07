import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role-specific welcome content; grows into the real dashboard in later phases.
const roleContent = {
  student: {
    emoji: "🎓",
    title: "Student Dashboard",
    next: [
      "Complete your academic profile (Profile page in the navbar)",
      "Explore universities & programs (Phase 3)",
      "Get your AI cost prediction (Phase 4)",
    ],
  },
  mentor: {
    emoji: "🧭",
    title: "Mentor Dashboard",
    next: [
      "Complete your mentor profile & expertise",
      "Await admin verification to appear in search",
      "Set your availability for sessions",
    ],
  },
  admin: {
    emoji: "🛡️",
    title: "Admin Dashboard",
    next: [],
    actions: [
      { to: "/admin/mentors", label: "Review mentor applications →" },
      { to: "/admin/scholarships", label: "Review scraped scholarship data →" },
      { to: "/admin/aggregator", label: "Open Aggregator Dashboard →" },
    ],
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const content = roleContent[user.role] ?? roleContent.student;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800">
        {content.emoji} {content.title}
      </h1>
      <p className="mt-1 text-slate-500">
        Welcome, <span className="font-medium text-slate-700">{user.name}</span>!
        You&apos;re logged in as a{" "}
        <span className="font-medium capitalize text-indigo-600">{user.role}</span>.
      </p>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          What&apos;s next
        </h2>
        <ul className="mt-3 space-y-2">
          {content.actions?.map((a) => (
            <li key={a.to}>
              <Link
                to={a.to}
                className="font-medium text-indigo-600 hover:underline"
              >
                {a.label}
              </Link>
            </li>
          ))}
          {content.next.map((item) => (
            <li key={item} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
