// Public-site header (landing page only). The signed-in app uses AppShell.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import { Button, cx } from "./ui";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export default function MarketingNav() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cx(
        "glass sticky top-0 z-40 transition-shadow duration-200",
        scrolled ? "border-b border-slate-200/70 shadow-[0_1px_12px_rgb(15_23_42/0.05)]" : "border-b border-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-brand)]">
            <Icon name="bridge" className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-ink-900">
            Grad<span className="text-brand-600">Bridge</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900">
              {l.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <Button to="/dashboard" size="sm">Go to dashboard</Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Log in</Button>
              <Button to="/register" size="sm">Get started</Button>
            </>
          )}
          <button onClick={() => setOpen((v) => !v)} aria-label="Menu"
            className="rounded-lg p-2 text-ink-700 transition-colors hover:bg-slate-100 md:hidden">
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-rise border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-100">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
