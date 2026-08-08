import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";

const selectClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none";

// A small green pin as a divIcon — avoids Leaflet's bundler image issues.
const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:#16a34a;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -20],
});

export default function NetworkMap() {
  const navigate = useNavigate();
  // The Survival Guide's "see them on the Network Map" chip links here with
  // ?country=… so the map opens pre-filtered to that campus's country.
  const [searchParams] = useSearchParams();
  const [pins, setPins] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    country: searchParams.get("country") ?? "all",
    degreeLevel: "all",
    subject: "",
  });

  const mapDivRef = useRef(null);   // the <div> Leaflet renders into
  const mapRef = useRef(null);      // the Leaflet map instance
  const markersRef = useRef([]);    // current markers, so we can clear them

  // Load pins once.
  useEffect(() => {
    api("/api/users/network-map")
      .then((d) => setPins(d.pins))
      .catch((err) => setError(err.message));
  }, []);

  // Create the map once (world view centred between Europe and Asia).
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    const map = L.map(mapDivRef.current).setView([30, 40], 2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
  }, []);

  // Spec: filterable by country, degree, and subject.
  const visible = useMemo(
    () =>
      pins.filter(
        (p) =>
          (filters.country === "all" || p.country === filters.country) &&
          (filters.degreeLevel === "all" || p.degreeLevel === filters.degreeLevel) &&
          (!filters.subject ||
            p.subject?.toLowerCase().includes(filters.subject.toLowerCase()))
      ),
    [pins, filters]
  );

  // Redraw markers whenever the visible set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Popup content is a real DOM element (not an HTML string) so the
    // cross-link can navigate inside the SPA instead of a full page reload.
    const popupContent = (p) => {
      const el = document.createElement("div");
      el.innerHTML = `<strong>${p.name}</strong><br/>
         ${p.degreeLevel ?? ""} in ${p.subject ?? "—"}<br/>
         🎓 ${p.university ?? "—"}<br/>
         📍 ${p.city}, ${p.country}<br/>`;
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = "🧭 Explore this area →";
      link.className = "mt-1 inline-block text-sm font-medium text-indigo-600 hover:underline";
      link.onclick = (e) => {
        e.preventDefault();
        // Same "most specific first" shape the Survival Guide geocodes best.
        const q = [p.university, p.city, p.country].filter(Boolean).join(", ");
        navigate(`/survival-guide?q=${encodeURIComponent(q)}`);
      };
      el.appendChild(link);
      return el;
    };

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = visible.map((p) =>
      L.marker([p.lat, p.lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(popupContent(p))
    );

    // Zoom to fit the filtered pins (with a little padding).
    if (visible.length > 0) {
      map.fitBounds(
        L.latLngBounds(visible.map((p) => [p.lat, p.lng])).pad(0.3),
        { maxZoom: 6 }
      );
    }
  }, [visible, navigate]);

  const countries = [...new Set(pins.map((p) => p.country))].sort();

  // Sidebar card → fly the map to that student's pin and open its popup.
  // markersRef is built from `visible` in the same order, so indices align.
  const focusPin = (i) => {
    const marker = markersRef.current[i];
    const map = mapRef.current;
    if (!marker || !map) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 6), { duration: 0.8 });
    marker.openPopup();
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">🗺️ Bangladeshi Abroad Network</h1>
      <p className="mt-1 text-slate-500">
        Find students already living where you plan to move. Are you abroad?
        Opt in from your Profile page.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={filters.country}
          onChange={(e) => setFilters({ ...filters, country: e.target.value })}
          className={selectClass}>
          <option value="all">All countries</option>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={filters.degreeLevel}
          onChange={(e) => setFilters({ ...filters, degreeLevel: e.target.value })}
          className={selectClass}>
          <option value="all">All degrees</option>
          <option>Bachelors</option>
          <option>Masters</option>
          <option>PhD</option>
        </select>
        <input value={filters.subject} placeholder="Filter by subject…"
          onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
          className={selectClass} />
      </div>

      {/* Map + a sidebar of profile cards mirroring the current filters */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div ref={mapDivRef}
          className="h-[65vh] w-full rounded-xl border border-slate-200 shadow-sm lg:flex-1" />

        <aside className="flex w-full shrink-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:h-[65vh] lg:w-72">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            🎓 Students
            <span className="ml-auto text-xs font-normal text-slate-400">
              {visible.length} shown
            </span>
          </h2>

          {visible.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">
              No students match these filters yet — try widening them, or opt in
              from your Profile page if you're already abroad.
            </p>
          ) : (
            <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
              {visible.map((p, i) => (
                <li key={p.id}>
                  <button type="button" onClick={() => focusPin(i)}
                    className="w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
                        {p.name?.[0] ?? "?"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {p.degreeLevel ?? "Student"}
                          {p.subject ? ` in ${p.subject}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1.5 truncate text-xs text-slate-500">🎓 {p.university ?? "—"}</p>
                    <p className="truncate text-xs text-slate-400">📍 {p.city}, {p.country}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
