// Split-screen shell shared by Login and Register: form on the left,
// brand panel on the right (hidden on mobile, where it would just push
// the form below the fold).
import { Link } from "react-router-dom";
import Icon from "./Icon";

const POINTS = [
  { icon: "wallet", text: "First-year costs in USD and BDT, checked against live rates" },
  { icon: "target", text: "Eligibility gaps against real program requirements" },
  { icon: "map", text: "Students already abroad — see who's online, say hi" },
  { icon: "passport", text: "Visa checklists built for Bangladeshi applicants" },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex flex-1">
      {/* form side */}
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-8 lg:w-1/2 lg:px-16">
        <div className="animate-rise mx-auto w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-brand)]">
              <Icon name="bridge" className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">
              Grad<span className="text-brand-600">Bridge</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
        </div>
      </div>

      {/* brand side */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-16">
        <div aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(28rem_18rem_at_25%_15%,rgb(255_255_255/0.16),transparent_60%)]" />
        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-200">
            Study abroad, decided smarter
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight text-white">
            Every decision, backed by something better than a Facebook group.
          </h2>

          <ul className="mt-10 space-y-5">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
                  <Icon name={p.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className="pt-1.5 text-sm leading-relaxed text-brand-50">{p.text}</span>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-xs text-brand-200">
            Free forever · No credit card · Built for Bangladeshi students
          </p>
        </div>
      </aside>
    </div>
  );
}
