// Shown for any URL that matches no route. Without this the router rendered
// nothing at all, so a typo'd or stale link produced a blank page.
//
// Works signed-in or signed-out: it renders full-bleed rather than inside the
// app shell, and offers the right destination for whoever is looking at it.
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { Button } from "../components/ui";

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="bg-app flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <Link to="/" className="mb-10 inline-flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[var(--shadow-brand)]">
          <Icon name="bridge" className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-ink-900">
          Grad<span className="text-brand-600">Bridge</span>
        </span>
      </Link>

      <p className="text-sm font-semibold uppercase tracking-[0.1em] text-brand-600">
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        That page doesn&apos;t exist
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">
        The link may be out of date, or the address may have a typo. Nothing you
        saved has been lost.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {user ? (
          <Button to="/dashboard">
            Back to your dashboard <Icon name="arrowRight" className="h-4 w-4" />
          </Button>
        ) : (
          <Button to="/">
            Back to the home page <Icon name="arrowRight" className="h-4 w-4" />
          </Button>
        )}
        {user && (
          <Button to="/" variant="secondary">
            Home page
          </Button>
        )}
      </div>
    </div>
  );
}
