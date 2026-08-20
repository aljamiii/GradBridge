import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Icon from "../components/Icon";
import {
  Alert, Badge, Button, Card, EmptyState, Field, Input, Page, PageHeader, Skeleton, cx,
} from "../components/ui";

/* ----------------------------------------------------------------- pieces */

// Universities have no logos in the free Hipolabs data, so we generate a
// stable monogram from the name — gives every card a consistent anchor.
function Monogram({ name }) {
  const initials = (name ?? "")
    .replace(/^(The|University of|Universite|Universidad)\s+/i, "")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]).join("").toUpperCase();
  // Deterministic hue from the name so the same school is always the same colour.
  const hue = [...(name ?? "")].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 62% 55%), hsl(${(hue + 40) % 360} 62% 42%))` }}
      aria-hidden="true"
    >
      {initials || "U"}
    </span>
  );
}

function Location({ item }) {
  const place = [item.stateProvince, item.country].filter(Boolean).join(", ");
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-400">
      <span className="flex items-center gap-1">
        <Icon name="location" className="h-3.5 w-3.5" /> {place || "—"}
      </span>
      {item.website && (
        <a href={item.website} target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-brand-600 hover:underline">
          <Icon name="external" className="h-3.5 w-3.5" /> Website
        </a>
      )}
    </p>
  );
}

function ResultCard({ uni, saved, onSave, busy }) {
  return (
    <Card hover className="!p-4">
      <div className="flex items-start gap-3.5">
        <Monogram name={uni.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold leading-snug text-ink-900">{uni.name}</h3>
            {uni.popular && <Badge tone="amber">Popular</Badge>}
          </div>
          <Location item={uni} />
        </div>
        <Button size="sm" variant={saved ? "secondary" : "primary"}
          disabled={busy || saved} onClick={() => onSave(uni)} className="shrink-0">
          <Icon name={saved ? "check" : "star"} className="h-3.5 w-3.5"
            strokeWidth={saved ? 2.4 : 1.8} />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
    </Card>
  );
}

function FavoriteCard({ fav, onUpdateNotes, onRemove, busy }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(fav.notes ?? "");

  const save = async () => {
    await onUpdateNotes(fav._id, notes);
    setEditing(false);
  };

  return (
    <Card className="!p-4">
      <div className="flex items-start gap-3.5">
        <Monogram name={fav.name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug text-ink-900">{fav.name}</h3>
          <Location item={fav} />
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Button size="sm" variant="ghost" disabled={busy}
            onClick={() => { setNotes(fav.notes ?? ""); setEditing(!editing); }}>
            <Icon name="settings" className="h-3.5 w-3.5" />
            {editing ? "Cancel" : fav.notes ? "Edit" : "Note"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy}
            onClick={() => onRemove(fav._id)}
            className="text-red-600 hover:bg-red-50">
            <Icon name="close" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500}
            placeholder="Full funding for ML students · deadline Dec 1"
            className="min-w-48 flex-1" />
          <Button size="sm" onClick={save} disabled={busy}>Save note</Button>
        </div>
      ) : (
        fav.notes && (
          <p className="glass-inset mt-3 rounded-lg px-3 py-2 text-sm leading-relaxed text-ink-500">
            {fav.notes}
          </p>
        )
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------- page */
const QUICK_COUNTRIES = [
  { label: "USA", value: "United States" },
  { label: "UK", value: "United Kingdom" },
  { label: "Canada", value: "Canada" },
  { label: "Australia", value: "Australia" },
  { label: "Germany", value: "Germany" },
];

export default function Universities() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [results, setResults] = useState(null); // null = not searched yet
  const [favorites, setFavorites] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("results");

  useEffect(() => {
    api("/api/favorites")
      .then((d) => setFavorites(d.favorites))
      .catch((err) => setError(err.message));
  }, []);

  const savedNames = useMemo(() => new Set(favorites.map((f) => f.name)), [favorites]);
  const resetSearch = () => {
    setName("");
    setCountry("");
    setResults(null);
    setError("");
    setTab("results");
  };
  const search = async (e) => {
    e.preventDefault();
    setSearching(true);
    setError("");
    setTab("results");
    try {
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (country) params.set("country", country);
      const d = await api(`/api/universities/search?${params}`);
      setResults(d.universities);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const saveFavorite = (uni) => run(async () => {
    const d = await api("/api/favorites", { method: "POST", body: uni });
    setFavorites((f) => [d.favorite, ...f]);
  });

  const updateNotes = (id, notes) => run(async () => {
    const d = await api(`/api/favorites/${id}`, { method: "PUT", body: { notes } });
    setFavorites((f) => f.map((x) => (x._id === id ? d.favorite : x)));
  });

  const removeFavorite = (id) => run(async () => {
    await api(`/api/favorites/${id}`, { method: "DELETE" });
    setFavorites((f) => f.filter((x) => x._id !== id));
  });

  const showing = tab === "results" ? results : favorites;

  return (
    <Page width="6xl">
      <PageHeader
        eyebrow="Module 3 · Hipolabs API"
        title="University Explorer"
        description="Search 9,000+ universities worldwide, shortlist the ones you're targeting, and keep a private note on each."
        actions={
          favorites.length > 0 && (
            <Button to="/survival-guide" variant="secondary">
              <Icon name="compass" className="h-4 w-4" /> Explore a campus area
            </Button>
          )
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        {/* --------------------------------------------------- search rail */}
        <div className="lg:col-span-1">
          <Card
            as="form"
            onSubmit={search}
            className="overflow-hidden !p-0 lg:sticky lg:top-24"
          >
            {/* Search-card heading */}
            <div className="border-b border-white/60 bg-gradient-to-r from-brand-50/90 to-white/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <Icon name="search" className="h-4.5 w-4.5" strokeWidth={2} />
                </span>

                <div>
                  <h2 className="font-semibold text-ink-900">
                    Find a university
                  </h2>

                  <p className="mt-0.5 text-xs text-ink-400">
                    Search by name, country or both
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                <Field label="University name">
                  <div className="relative">
                    <Icon
                      name="graduation"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                    />

                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. University of Toronto"
                      className="pl-10"
                    />
                  </div>
                </Field>

                <Field label="Country" hint="You can use common names such as USA or UK.">
                  <div className="relative">
                    <Icon
                      name="globe"
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                    />

                    <Input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Canada"
                      className="pl-10"
                    />
                  </div>
                </Field>

                {/* Quick country selections */}
                <div>
                  <p className="mb-2 text-xs font-medium text-ink-400">
                    Popular destinations
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {QUICK_COUNTRIES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setCountry(item.value)}
                        className={cx(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                          country === item.value
                            ? "border-brand-300 bg-brand-50 text-brand-700 shadow-sm"
                            : "border-slate-200 bg-white/70 text-ink-500 hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-700"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
                <Button type="submit" loading={searching}>
                  {!searching && <Icon name="search" className="h-4 w-4" />}
                  {searching ? "Searching…" : "Search universities"}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetSearch}
                  disabled={!name && !country && results == null}
                  className="px-3"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <Icon name="close" className="h-4 w-4" />
                </Button>
              </div>

              {/* Shortlist summary */}
              <button
                type="button"
                onClick={() => setTab("saved")}
                className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/70 bg-white/50 px-3.5 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/60"
              >
                <span className="flex items-center gap-2 text-sm text-ink-500">
                  <Icon name="star" className="h-4 w-4 text-amber-500" />
                  My shortlist
                </span>

                <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-600 px-2 text-xs font-bold text-white">
                  {favorites.length}
                </span>
              </button>
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------ results */}
        <div className="lg:col-span-3">
          {/* tabs */}
          <div className="mb-4 flex gap-1 rounded-xl bg-white/50 p-1 backdrop-blur-sm ring-1 ring-white/60">
            {[
              { id: "results", label: "Search results", count: results?.length },
              { id: "saved", label: "My shortlist", count: favorites.length },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cx(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  tab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-ink-400 hover:text-ink-700"
                )}>
                {t.label}
                {t.count != null && (
                  <span className={cx("ml-1.5 text-xs", tab === t.id ? "text-brand-500" : "text-ink-400")}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {error && <Alert tone="error" className="mb-4">{error}</Alert>}

          {searching && tab === "results" && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          )}

          {!searching && tab === "results" && (
            results == null ? (
              <Card>
                <EmptyState
                  icon={<Icon name="search" className="h-6 w-6" />}
                  title="Search to begin"
                  description="Enter a university name, a country, or both. Results come live from the Hipolabs universities API."
                />
              </Card>
            ) : results.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Icon name="search" className="h-6 w-6" />}
                  title="Nothing matched"
                  description="Try a shorter name — “Toronto” finds more than “University of Toronto Scarborough”."
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Index is part of the key: Hipolabs can return two entries
                    with the same name+country (campuses, duplicates). */}
                {results.map((uni, i) => (
                  <ResultCard key={`${uni.name}|${uni.country}|${i}`} uni={uni}
                    saved={savedNames.has(uni.name)} onSave={saveFavorite} busy={busy} />
                ))}
              </div>
            )
          )}

          {tab === "saved" && (
            favorites.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Icon name="star" className="h-6 w-6" />}
                  title="Your shortlist is empty"
                  description="Save universities from the search results. Notes you add here show up nowhere else — they're just for you."
                  action={<Button onClick={() => setTab("results")} variant="secondary">Back to search</Button>}
                />
              </Card>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <FavoriteCard key={fav._id} fav={fav} onUpdateNotes={updateNotes}
                    onRemove={removeFavorite} busy={busy} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Page>
  );
}
