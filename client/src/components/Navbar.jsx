import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  disconnectSocket,
  getSocket,
} from "../lib/socket";


const EXPLORE_ITEMS = [
  {
    to: "/universities",
    label: "Universities",
    icon: "🎓",
    description: "Search and save universities",
  },
  {
    to: "/scholarships",
    label: "Scholarships",
    icon: "🎁",
    description: "Discover funding opportunities",
  },
  {
    to: "/success-path",
    label: "Success Paths",
    icon: "📈",
    description: "Explore historical admission patterns",
  },
  {
    to: "/network-map",
    label: "Network Map",
    icon: "🗺️",
    description: "Find Bangladeshis studying abroad",
  },
  {
    to: "/survival-guide",
    label: "Survival Guide",
    icon: "🧭",
    description: "Explore essentials around campus",
  },
  {
    to: "/mentors",
    label: "Find a Mentor",
    icon: "🧑‍🏫",
    description: "Connect with verified mentors",
  },
];


const TOOLS_ITEMS = [
  {
    to: "/cost-predictor",
    label: "Cost Predictor",
    icon: "💰",
    description: "Estimate your first-year expenses",
  },
  {
    to: "/eligibility",
    label: "Eligibility Check",
    icon: "🎯",
    description: "Check academic eligibility and gaps",
  },
  {
    to: "/destination-advisor",
    label: "Destination Advisor",
    icon: "🌍",
    description: "Ask questions about destinations",
  },
  {
    to: "/compatibility",
    label: "Compatibility Score",
    icon: "🧩",
    description: "See how well a destination fits you",
  },
  {
    to: "/financial-risk",
    label: "Risk & Savings",
    icon: "📉",
    description: "Understand funding gaps and risk",
  },
  {
    to: "/visa-checklist",
    label: "Visa Checklist",
    icon: "🛂",
    description: "Track your visa documents",
  },
  {
    to: "/job-pr",
    label: "Jobs & PR Points",
    icon: "💼",
    description: "Explore job prospects and PR points",
  },
];


const baseLinkClass =
  "relative rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200";


function Menu({
  label,
  items,
}) {
  const [open, setOpen] =
    useState(false);

  const location =
    useLocation();


  const menuActive =
    items.some(
      (item) =>
        location.pathname === item.to ||
        location.pathname.startsWith(
          `${item.to}/`
        )
    );


  return (
    <div className="relative">

      <button
        type="button"
        onClick={() =>
          setOpen(
            (current) => !current
          )
        }
        className={`${baseLinkClass} flex items-center gap-1.5 ${
          menuActive || open
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {label}

        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 transition-transform duration-200 ${
            open
              ? "rotate-180"
              : ""
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 7.97a.75.75 0 0 1 1.06 0L10 11.69l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.03a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>

      </button>


      {open && (
        <>
          {/* Clicking outside closes the dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() =>
              setOpen(false)
            }
          />


          <div className="absolute left-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xl shadow-slate-300/40">

            <div className="px-3 pb-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                {label}
              </p>
            </div>


            <div className="space-y-1">

              {items.map(
                (item) => {
                  const active =
                    location.pathname ===
                      item.to ||
                    location.pathname.startsWith(
                      `${item.to}/`
                    );


                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() =>
                        setOpen(false)
                      }
                      className={`group flex items-start gap-3 rounded-xl px-3 py-3 transition ${
                        active
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                      }`}
                    >

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition ${
                          active
                            ? "bg-white shadow-sm"
                            : "bg-slate-100 group-hover:bg-white"
                        }`}
                      >
                        {item.icon}
                      </div>


                      <div className="min-w-0">

                        <p
                          className={`text-sm font-semibold ${
                            active
                              ? "text-indigo-700"
                              : "text-slate-800"
                          }`}
                        >
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-400">
                          {
                            item.description
                          }
                        </p>

                      </div>

                    </Link>
                  );
                }
              )}

            </div>

          </div>
        </>
      )}

    </div>
  );
}


export default function Navbar() {
  const { user, logout } =
    useAuth();

  const navigate =
    useNavigate();

  const [unread, setUnread] =
    useState(0);


  const refreshUnread =
    useCallback(() => {
      api(
        "/api/chat/unread-count"
      )
        .then((data) =>
          setUnread(
            data.count
          )
        )
        .catch(() => {});
    }, []);


  useEffect(() => {
    if (
      !user ||
      user.role === "admin"
    ) {
      return;
    }


    refreshUnread();


    const socket =
      getSocket();


    socket?.on(
      "inbox:update",
      refreshUnread
    );


    return () => {
      socket?.off(
        "inbox:update",
        refreshUnread
      );
    };
  }, [
    user,
    refreshUnread,
  ]);


  const handleLogout = () => {
    disconnectSocket();

    logout();

    navigate("/");
  };


  const getNavClass =
    ({ isActive }) =>
      `${baseLinkClass} ${
        isActive
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`;


  const userInitial =
    user?.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl">

      <div className="mx-auto flex min-h-[68px] w-full max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">

        {/* ---------------------------
            BRAND
        ---------------------------- */}

        <Link
          to="/"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-bold text-white shadow-md shadow-indigo-200 transition group-hover:scale-[1.03]">
            G
          </div>

          <div className="hidden sm:block">
            <p className="text-lg font-bold tracking-tight text-slate-900">
              Grad
              <span className="text-indigo-600">
                Bridge
              </span>
            </p>

            <p className="-mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Study smarter
            </p>
          </div>
        </Link>


        {/* ---------------------------
            RIGHT SIDE
        ---------------------------- */}

        <div className="flex min-w-0 items-center gap-1 overflow-visible py-2">

          {user ? (
            <>

              {/* Dashboard */}

              <NavLink
                to="/dashboard"
                className={
                  getNavClass
                }
              >
                Dashboard
              </NavLink>


              {/* Student menus */}

              {user.role ===
                "student" && (
                <>
                  <Menu
                    label="Explore"
                    items={
                      EXPLORE_ITEMS
                    }
                  />

                  <Menu
                    label="Tools"
                    items={
                      TOOLS_ITEMS
                    }
                  />
                </>
              )}


              {/* Student + Mentor */}

              {(user.role ===
                "student" ||
                user.role ===
                  "mentor") && (
                <>

                  <NavLink
                    to="/forum"
                    className={
                      getNavClass
                    }
                  >
                    Forum
                  </NavLink>


                  <NavLink
                    to="/bookings"
                    className={
                      getNavClass
                    }
                  >
                    Sessions
                  </NavLink>


                  <NavLink
                    to="/chat"
                    className={({
                      isActive,
                    }) =>
                      `${baseLinkClass} ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`
                    }
                  >

                    <span className="relative">

                      Chat

                      {unread >
                        0 && (
                        <span className="absolute -right-4 -top-3 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">

                          {unread >
                          99
                            ? "99+"
                            : unread}

                        </span>
                      )}

                    </span>

                  </NavLink>

                </>
              )}


              {/* Divider */}

              <div className="mx-2 hidden h-7 w-px bg-slate-200 lg:block" />


              {/* Profile */}

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-2 py-1.5 transition ${
                    isActive
                      ? "bg-indigo-50"
                      : "hover:bg-slate-100"
                  }`
                }
              >

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                  {
                    userInitial
                  }
                </div>


                <div className="hidden max-w-[110px] lg:block">

                  <p className="truncate text-xs font-semibold text-slate-700">
                    {user.name ||
                      "Profile"}
                  </p>

                  <p className="text-[10px] capitalize text-slate-400">
                    {
                      user.role
                    }
                  </p>

                </div>

              </NavLink>


              {/* Logout */}

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="ml-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                Log out
              </button>

            </>
          ) : (
            <>

              {/* Guest */}

              <NavLink
                to="/login"
                className={
                  getNavClass
                }
              >
                Log in
              </NavLink>


              <Link
                to="/register"
                className="ml-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
              >
                Sign up
              </Link>

            </>
          )}

        </div>

      </div>

    </nav>
  );
}
