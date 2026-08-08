// Shared UI primitives. Every page composes these instead of repeating
// Tailwind strings, so spacing, radii, shadows and states stay identical
// across 20+ feature pages.
import { Link } from "react-router-dom";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ---------------------------------------------------------------- Surfaces */

// The standard content surface. `hover` adds the lift micro-interaction —
// only use it when the whole card is clickable.
export function Card({ as: Tag = "div", hover = false, padded = true, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]",
        padded && "p-5 sm:p-6",
        hover && "lift hover:border-brand-200",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Small label above a card's content ("SYSTEM STATUS", "WHAT'S NEXT").
export function CardTitle({ children, right, className }) {
  return (
    <div className={cx("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
        {children}
      </h2>
      {right}
    </div>
  );
}

/* ------------------------------------------------------------ Page heading */

// Consistent page masthead: optional eyebrow, title, description, actions.
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header className={cx("animate-rise", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-brand-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold text-ink-900 sm:text-[1.75rem]">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

// The standard page shell: max width, padding, vertical rhythm.
export function Page({ width = "5xl", className, children }) {
  const widths = { "3xl": "max-w-3xl", "4xl": "max-w-4xl", "5xl": "max-w-5xl", "6xl": "max-w-6xl", full: "max-w-7xl" };
  return (
    <div className={cx("mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10", widths[width], className)}>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- Buttons */

const BUTTON_VARIANTS = {
  primary:
    "bg-brand-600 text-white shadow-[var(--shadow-brand)] hover:bg-brand-700 hover:shadow-lg active:scale-[0.98]",
  secondary:
    "border border-slate-300 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 active:scale-[0.98]",
  ghost: "text-ink-500 hover:bg-slate-100 hover:text-ink-900",
  danger: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
};

const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

// Renders as <button>, or <Link>/<a> when `to`/`href` is given.
export function Button({
  variant = "primary", size = "md", to, href, className, children, loading, disabled, ...rest
}) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className
  );
  const content = (
    <>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </>
  );
  if (to) return <Link to={to} className={classes} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={classes} {...rest}>{content}</a>;
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ Badges */

const BADGE_TONES = {
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  slate: "bg-slate-100 text-ink-500 ring-slate-500/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
};

export function Badge({ tone = "slate", className, children, ...rest }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        BADGE_TONES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------- Forms */

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 " +
  "placeholder-slate-400 transition-colors " +
  "hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10";

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx("block", className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Input({ className, ...rest }) {
  return <input className={cx(inputClass, className)} {...rest} />;
}

export function Select({ className, children, ...rest }) {
  return (
    <select className={cx(inputClass, "cursor-pointer pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }) {
  return <textarea className={cx(inputClass, "min-h-24 resize-y", className)} {...rest} />;
}

/* ------------------------------------------------------------------ States */

export function Spinner({ className }) {
  return (
    <svg className={cx("animate-spin", className ?? "h-5 w-5")} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2Z" />
    </svg>
  );
}

const ALERT_TONES = {
  error: "border-red-200 bg-red-50 text-red-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-brand-200 bg-brand-50 text-brand-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

export function Alert({ tone = "info", className, children }) {
  return (
    <div className={cx("rounded-xl border px-4 py-3 text-sm", ALERT_TONES[tone], className)} role="status">
      {children}
    </div>
  );
}

// Honest empty state: says what's missing and what to do about it.
export function EmptyState({ icon = "✨", title, description, action, className }) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        {icon}
      </div>
      <p className="font-semibold text-ink-900">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Placeholder rows while data loads — steadier than a spinner for lists.
export function Skeleton({ className }) {
  return <div className={cx("skeleton rounded-lg", className)} aria-hidden="true" />;
}

/* -------------------------------------------------------------- Stat tiles */

// A single number with a label — used on the dashboard and insight pages.
export function Stat({ label, value, hint, icon, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <Card className="flex items-start gap-4" padded={false}>
      <div className="flex w-full items-start gap-4 p-5">
        {icon && (
          // Accepts an <Icon/> element or any node (emoji, image).
          <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-ink-400">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Avatar */

// Initial-based avatar with an optional live-presence dot.
export function Avatar({ name, size = "md", online = false, className }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };
  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white",
        sizes[size],
        className
      )}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
      {online && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-sky-500" />
        </span>
      )}
    </span>
  );
}

export { cx };
