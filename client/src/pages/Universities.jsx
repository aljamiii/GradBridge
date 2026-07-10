import { useEffect, useState } from "react";
import { api } from "../lib/api";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none";

// ---------- One search result row ----------
function ResultCard({ uni, savedNames, onSave, busy }) {
  const alreadySaved = savedNames.has(uni.name);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-slate-800">
          {uni.name}
          {uni.popular && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              ⭐ Popular
            </span>
          )}
        </h3>
        <p className="text-sm text-slate-500">
          {[uni.stateProvince, uni.country].filter(Boolean).join(", ")}
          {uni.website && (
            <>
              {" · "}
              <a href={uni.website} target="_blank" rel="noreferrer"
                className="text-indigo-600 hover:underline">
                website ↗
              </a>
            </>
          )}
        </p>
      </div>
      <button
        onClick={() => onSave(uni)}
        disabled={busy || alreadySaved}
        className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
          alreadySaved
            ? "bg-slate-100 text-slate-400"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        } disabled:opacity-70`}
      >
        {alreadySaved ? "★ Saved" : "☆ Save"}
      </button>
    </div>
  );
}

// ---------- One favorite row (edit notes / remove) ----------
function FavoriteCard({ fav, onUpdateNotes, onRemove, busy }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(fav.notes);

  const save = async () => {
    await onUpdateNotes(fav._id, notes);
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-800">{fav.name}</h3>
          <p className="text-sm text-slate-500">
            {[fav.stateProvince, fav.country].filter(Boolean).join(", ")}
            {fav.website && (
              <>
                {" · "}
                <a href={fav.website} target="_blank" rel="noreferrer"
                  className="text-indigo-600 hover:underline">
                  website ↗
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(!editing)} disabled={busy}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50">
            {editing ? "Cancel" : fav.notes ? "Edit note" : "Add note"}
          </button>
          <button onClick={() => onRemove(fav._id)} disabled={busy}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
            Remove
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 flex gap-2">
          <input value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Has full funding for ML students; deadline Dec 1"
            maxLength={500} className={inputClass} />
          <button onClick={save} disabled={busy}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            Save note
          </button>
        </div>
      ) : (
        fav.notes && <p className="mt-2 text-sm text-slate-600">📝 {fav.notes}</p>
      )}
    </div>
  );
}

// ---------- The page ----------
export default function Universities() {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [results, setResults] = useState(null); // null = not searched yet
  const [favorites, setFavorites] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Load favorites once on page open.
  useEffect(() => {
    api("/api/favorites")
      .then((data) => setFavorites(data.favorites))
      .catch((err) => setError(err.message));
  }, []);

  const savedNames = new Set(favorites.map((f) => f.name));

  const search = async (e) => {
    e.preventDefault();
    setSearching(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (country) params.set("country", country);
      const data = await api(`/api/universities/search?${params}`);
      setResults(data.universities);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const saveFavorite = async (uni) => {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/favorites", { method: "POST", body: uni });
      setFavorites([data.favorite, ...favorites]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateNotes = async (id, notes) => {
    setBusy(true);
    setError("");
    try {
      const data = await api(`/api/favorites/${id}`, { method: "PUT", body: { notes } });
      setFavorites(favorites.map((f) => (f._id === id ? data.favorite : f)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeFavorite = async (id) => {
    setBusy(true);
    setError("");
    try {
      await api(`/api/favorites/${id}`, { method: "DELETE" });
      setFavorites(favorites.filter((f) => f._id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800">🎓 University Explorer</h1>
      <p className="mt-1 text-slate-500">
        Search universities worldwide and save the ones you&apos;re targeting.
      </p>

      {/* Search form */}
      <form onSubmit={search} className="mt-6 flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="University name (e.g., Toronto)" className={`${inputClass} flex-1 min-w-40`} />
        <input value={country} onChange={(e) => setCountry(e.target.value)}
          placeholder="Country (e.g., Canada)" className={`${inputClass} flex-1 min-w-40`} />
        <button type="submit" disabled={searching}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Results */}
      {results && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Results ({results.length})
          </h2>
          {results.length === 0 ? (
            <p className="text-slate-400">No universities matched that search.</p>
          ) : (
            <div className="space-y-3">
              {results.map((uni) => (
                <ResultCard key={uni.name + uni.country} uni={uni}
                  savedNames={savedNames} onSave={saveFavorite} busy={busy} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Favorites */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          ★ My Favorites ({favorites.length})
        </h2>
        {favorites.length === 0 ? (
          <p className="text-slate-400">
            Nothing saved yet — search above and hit ☆ Save.
          </p>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <FavoriteCard key={fav._id} fav={fav} onUpdateNotes={updateNotes}
                onRemove={removeFavorite} busy={busy} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
