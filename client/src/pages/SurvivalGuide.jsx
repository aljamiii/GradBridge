import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = {
  mosques: { label: "Mosques", emoji: "🕌", color: "#16a34a" },
  halal: { label: "Halal Food & Groceries", emoji: "🥘", color: "#ea580c" },
  hospitals: { label: "Hospitals", emoji: "🏥", color: "#dc2626" },
  transit: { label: "Transit Stops", emoji: "🚇", color: "#2563eb" },
};

const dot = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};
      border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.5)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const campusIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">🎓</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Same green teardrop as the Network Map — "a GradBridge person lives here".
const studentPin = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:#16a34a;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -20],
});

export default function SurvivalGuide() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null); // group holding amenity markers
  const studentLayerRef = useRef(null); // group holding nearby-student pins

  // Create the map once.
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    const map = L.map(mapDivRef.current).setView([23.78, 90.4], 3); // Dhaka-ish start
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    studentLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, []);

  // Redraw markers whenever a new result arrives.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !result) return;

    layer.clearLayers();

    L.marker([result.center.lat, result.center.lng], { icon: campusIcon })
      .addTo(layer)
      .bindPopup(`<strong>${result.query}</strong><br/>your campus`);

    const bounds = [[result.center.lat, result.center.lng]];
    for (const [key, cat] of Object.entries(CATEGORIES)) {
      for (const p of result.places[key] ?? []) {
        L.marker([p.lat, p.lng], { icon: dot(cat.color) })
          .addTo(layer)
          .bindPopup(
            `${cat.emoji} <strong>${p.name}</strong><br/>${p.distanceKm} km away${
              p.detail ? `<br/>${p.detail}` : ""
            }`
          );
        bounds.push([p.lat, p.lng]);
      }
    }

    // Re-measure the container before zooming — cures white/unrendered tiles
    // if anything about the layout shifted since the map was created.
    map.invalidateSize();
    map.fitBounds(L.latLngBounds(bounds).pad(0.15), { maxZoom: 15 });
  }, [result]);

  const search = async (e, preset) => {
    e?.preventDefault();
    const query = (preset ?? q).trim();
    if (!query) return;
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/survival-guide?q=${encodeURIComponent(query)}`);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Deep link from the Network Map: /survival-guide?q=… auto-runs the search.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const qp = searchParams.get("q");
    if (qp) {
      setQ(qp);
      search(null, qp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cross-link back: ask the network map's geospatial endpoint which
  // GradBridge students live near this campus (server-side $geoNear —
  // matched by distance, not name, and it excludes the current user).
  const [nearby, setNearby] = useState([]);
  useEffect(() => {
    if (!result) return;
    setNearby([]);
    api(
      `/api/users/network-map/nearby?lat=${result.center.lat}&lng=${result.center.lng}&radiusKm=10`
    )
      .then((d) => setNearby(d.students ?? []))
      .catch(() => {}); // enrichment only — never block the guide itself
  }, [result]);

  // Plot the nearby students on the map with the Network Map's green pin,
  // so "your people" appear right next to the mosques and halal shops.
  useEffect(() => {
    const layer = studentLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const s of nearby) {
      if (s.lat == null || s.lng == null) continue;
      L.marker([s.lat, s.lng], { icon: studentPin })
        .addTo(layer)
        .bindPopup(
          `<strong>${s.name}</strong><br/>
           ${s.degreeLevel ?? "Student"}${s.subject ? ` in ${s.subject}` : ""}<br/>
           🎓 ${s.university ?? "—"}<br/>
           ~${s.distanceKm} km from campus`
        );
    }
  }, [nearby]);

  // One-click shortcut using the student's saved favorites.
  const [favorites, setFavorites] = useState([]);
  useEffect(() => {
    api("/api/favorites").then((d) => setFavorites(d.favorites)).catch(() => {});
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">🧭 Housing & Survival Guide</h1>
      <p className="mt-1 text-slate-500">
        Everything you need near campus before you even land: mosques, halal food,
        hospitals, and transit — sorted by distance.
      </p>

      <form onSubmit={search} className="mt-5 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder='University or address (e.g., "University of Toronto, Canada")'
          className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none" />
        <button type="submit" disabled={loading}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Searching…" : "Explore"}
        </button>
      </form>

      {favorites.length > 0 && !result && (
        <div className="mt-3 flex flex-wrap gap-2">
          {favorites.slice(0, 4).map((f) => (
            <button key={f._id} onClick={(e) => { setQ(`${f.name}, ${f.country ?? ""}`); search(e, `${f.name}, ${f.country ?? ""}`); }}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-indigo-400 hover:text-indigo-600">
              ★ {f.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {result && nearby.length > 0 && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          🎓 {nearby.length} GradBridge student{nearby.length !== 1 && "s"} near this
          campus — green pin{nearby.length !== 1 && "s"} on the map.{" "}
          <Link
            to={`/network-map?country=${encodeURIComponent(nearby[0]?.country ?? "")}`}
            className="font-medium text-emerald-700 underline hover:text-emerald-900"
          >
            See their profiles on the Network Map →
          </Link>
        </div>
      )}

      {/* Fixed height: resizing a live Leaflet map leaves unrendered white
          areas unless invalidateSize() is called — simplest is not to resize. */}
      <div ref={mapDivRef}
        className="mt-5 h-[50vh] w-full rounded-xl border border-slate-200 shadow-sm" />

      {/* Category lists */}
      {result && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const items = result.places[key] ?? [];
            return (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                  <span style={{ color: cat.color }}>●</span> {cat.emoji} {cat.label}
                  <span className="ml-auto text-xs font-normal text-slate-400">
                    {items.length} found
                  </span>
                </h2>
                {items.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">
                    Nothing mapped within range — a country ambassador may know unlisted options.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {items.map((p, i) => (
                      <li key={`${p.name}-${i}`} className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-slate-700">
                          {p.name}
                          {p.detail && <span className="text-slate-400"> · {p.detail}</span>}
                        </span>
                        <span className="shrink-0 font-medium text-slate-500">{p.distanceKm} km</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {result && (
        <p className="mt-4 text-xs text-slate-400">
          Data from OpenStreetMap contributors — coverage varies by city; unlisted
          places may exist. Distances are straight-line.
        </p>
      )}
    </div>
  );
}
