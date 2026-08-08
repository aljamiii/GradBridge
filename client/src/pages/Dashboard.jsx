import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const roleContent = {
  student: {
    emoji: "🎓",
    eyebrow: "Student Workspace",
    title: "Plan your study-abroad journey",
    description:
      "Explore universities, understand your costs, prepare for life abroad, and connect with people who can help.",

    primaryAction: {
      to: "/universities",
      label: "Explore Universities",
    },

    secondaryAction: {
      to: "/profile",
      label: "Complete Profile",
    },

    next: [
      {
        title: "Complete your academic profile",
        description:
          "Add your academic background and study preferences to get more useful results.",
        to: "/profile",
        icon: "👤",
      },
      {
        title: "Explore universities",
        description:
          "Search programs and save universities you're interested in.",
        to: "/universities",
        icon: "🎓",
      },
      {
        title: "Estimate your study costs",
        description:
          "Get a clearer picture of your expected first-year expenses.",
        to: "/cost-predictor",
        icon: "💰",
      },
    ],

    tools: [
      {
        to: "/universities",
        icon: "🎓",
        title: "Universities",
        description:
          "Search and save universities that match your study goals.",
        action: "Explore",
      },
      {
        to: "/scholarships",
        icon: "🎁",
        title: "Scholarships",
        description:
          "Discover funding opportunities for international students.",
        action: "Find funding",
      },
      {
        to: "/cost-predictor",
        icon: "💰",
        title: "Cost Predictor",
        description:
          "Estimate tuition, living expenses, travel, and other costs.",
        action: "Calculate",
      },
      {
        to: "/eligibility",
        icon: "🎯",
        title: "Eligibility Check",
        description:
          "See how your academic profile matches admission requirements.",
        action: "Check eligibility",
      },
      {
        to: "/destination-advisor",
        icon: "🌍",
        title: "Destination Advisor",
        description:
          "Ask questions and learn more about potential study destinations.",
        action: "Ask advisor",
      },
      {
        to: "/compatibility",
        icon: "🧩",
        title: "Compatibility",
        description:
          "Compare destinations against your lifestyle and preferences.",
        action: "Check match",
      },
      {
        to: "/survival-guide",
        icon: "🧭",
        title: "Survival Guide",
        description:
          "Find mosques, halal options, hospitals, and transit near campus.",
        action: "Explore nearby",
      },
      {
        to: "/network-map",
        icon: "🗺️",
        title: "Network Map",
        description:
          "Discover Bangladeshi students and communities abroad.",
        action: "View network",
      },
      {
        to: "/mentors",
        icon: "🧑‍🏫",
        title: "Mentors",
        description:
          "Connect with people who can guide you through your journey.",
        action: "Find mentor",
      },
    ],
  },


  mentor: {
    emoji: "🧭",
    eyebrow: "Mentor Workspace",
    title: "Support students on their journey",
    description:
      "Manage your mentoring activity, sessions, conversations, and profile from one place.",

    primaryAction: {
      to: "/bookings",
      label: "View Sessions",
    },

    secondaryAction: {
      to: "/profile",
      label: "Update Profile",
    },

    next: [
      {
        title: "Complete your mentor profile",
        description:
          "Keep your expertise and background accurate for students.",
        to: "/profile",
        icon: "👤",
      },
      {
        title: "Review your sessions",
        description:
          "Keep track of upcoming and previous mentoring sessions.",
        to: "/bookings",
        icon: "📅",
      },
      {
        title: "Respond to students",
        description:
          "Check your conversations and answer student questions.",
        to: "/chat",
        icon: "💬",
      },
    ],

    tools: [
      {
        to: "/bookings",
        icon: "📅",
        title: "Sessions",
        description:
          "Manage your mentoring bookings and upcoming sessions.",
        action: "View sessions",
      },
      {
        to: "/chat",
        icon: "💬",
        title: "Messages",
        description:
          "Continue conversations with students you're supporting.",
        action: "Open chat",
      },
      {
        to: "/forum",
        icon: "💡",
        title: "Community Forum",
        description:
          "Answer questions and share useful experience with students.",
        action: "Visit forum",
      },
      {
        to: "/profile",
        icon: "👤",
        title: "Mentor Profile",
        description:
          "Update your background, expertise, and mentor information.",
        action: "Edit profile",
      },
    ],
  },


  admin: {
    emoji: "🛡️",
    eyebrow: "Administration",
    title: "Manage the GradBridge platform",
    description:
      "Review platform content and administrative workflows from your dashboard.",

    primaryAction: {
      to: "/admin/mentors",
      label: "Review Mentors",
    },

    secondaryAction: {
      to: "/admin/scholarships",
      label: "Review Scholarships",
    },

    next: [
      {
        title: "Review mentor applications",
        description:
          "Verify mentor applications before they become visible to students.",
        to: "/admin/mentors",
        icon: "🧑‍🏫",
      },
      {
        title: "Review scholarship data",
        description:
          "Inspect scholarship information before publishing or approving it.",
        to: "/admin/scholarships",
        icon: "🎁",
      },
    ],

    tools: [
      {
        to: "/admin/mentors",
        icon: "🧑‍🏫",
        title: "Mentor Applications",
        description:
          "Review and manage mentor verification requests.",
        action: "Review mentors",
      },
      {
        to: "/admin/scholarships",
        icon: "🎁",
        title: "Scholarship Data",
        description:
          "Review and manage collected scholarship information.",
        action: "Review data",
      },
      {
        to: "/profile",
        icon: "👤",
        title: "Admin Profile",
        description:
          "Review and update your account information.",
        action: "View profile",
      },
    ],
  },
};


export default function Dashboard() {
  const { user } = useAuth();

  const role = user?.role ?? "student";

  const content =
    roleContent[role] ?? roleContent.student;

  const firstName =
    user?.name?.trim()?.split(" ")[0] || "there";


  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">

      {/* HERO */}

      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-6 py-8 text-white shadow-lg shadow-indigo-100 sm:px-8 sm:py-10">

        <div className="relative z-10 max-w-3xl">

          <div className="flex flex-wrap items-center gap-3">

            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-50 backdrop-blur">
              {content.eyebrow}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize text-indigo-50">
              {role}
            </span>

          </div>


          <p className="mt-6 text-sm font-medium text-indigo-100">
            Welcome back, {firstName} 👋
          </p>


          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {content.title}
          </h1>


          <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
            {content.description}
          </p>


          <div className="mt-7 flex flex-wrap gap-3">

            <Link
              to={content.primaryAction.to}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {content.primaryAction.label}
              <span className="ml-2">→</span>
            </Link>


            <Link
              to={content.secondaryAction.to}
              className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              {content.secondaryAction.label}
            </Link>

          </div>

        </div>


        {/* Decorative shapes */}

        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[50px] border-white/5" />

        <div className="pointer-events-none absolute -bottom-28 right-24 h-60 w-60 rounded-full bg-white/5" />

        <div className="pointer-events-none absolute right-10 top-12 hidden text-[120px] opacity-[0.08] lg:block">
          {content.emoji}
        </div>

      </section>


      {/* NEXT STEPS */}

      <section className="mt-8">

        <div className="mb-4 flex items-end justify-between gap-4">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Recommended
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              What&apos;s next
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              A few useful things you can do next.
            </p>
          </div>

        </div>


        <div className="grid gap-4 md:grid-cols-3">

          {content.next.map(
            (item, index) => (

              <Link
                key={item.title}
                to={item.to}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                    {item.icon}
                  </div>


                  <span className="text-xs font-bold text-slate-300">
                    0{index + 1}
                  </span>

                </div>


                <h3 className="mt-5 font-semibold text-slate-900 transition group-hover:text-indigo-700">
                  {item.title}
                </h3>


                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>


                <p className="mt-4 text-sm font-semibold text-indigo-600">
                  Continue
                  <span className="ml-1 transition-transform group-hover:ml-2">
                    →
                  </span>
                </p>

              </Link>
            )
          )}

        </div>

      </section>


      {/* TOOLS */}

      <section className="mt-10">

        <div className="mb-5">

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
            Workspace
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {role === "student"
              ? "Your GradBridge tools"
              : role === "mentor"
              ? "Mentor tools"
              : "Administration tools"}
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {role === "student"
              ? "Everything you need to research, compare, prepare, and connect."
              : role === "mentor"
              ? "Manage your mentoring activity and communication."
              : "Quick access to platform administration."}
          </p>

        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {content.tools.map(
            (tool) => (

              <Link
                key={tool.to}
                to={tool.to}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-slate-200/60"
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-2xl ring-1 ring-indigo-100">
                    {tool.icon}
                  </div>


                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    →
                  </span>

                </div>


                <h3 className="mt-5 text-base font-semibold text-slate-900 transition group-hover:text-indigo-700">
                  {tool.title}
                </h3>


                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                  {tool.description}
                </p>


                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {tool.action}
                </p>


                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 group-hover:w-full" />

              </Link>
            )
          )}

        </div>

      </section>


      {/* ACCOUNT SUMMARY */}

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
              {user?.name
                ?.trim()
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>


            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Your account
              </p>

              <h3 className="mt-1 font-semibold text-slate-900">
                {user?.name || "GradBridge User"}
              </h3>

              <p className="mt-0.5 text-sm capitalize text-slate-500">
                {role} account
              </p>
            </div>

          </div>


          <Link
            to="/profile"
            className="inline-flex w-fit items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            View Profile
            <span className="ml-2">→</span>
          </Link>

        </div>

      </section>

    </main>
  );
}