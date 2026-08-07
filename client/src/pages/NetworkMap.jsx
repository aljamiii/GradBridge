import { useEffect, useMemo, useRef, useState } from "react";
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
  const [pins, setPins] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ country: "all", degreeLevel: "all", subject: "" });

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

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = visible.map((p) =>
      L.marker([p.lat, p.lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(
          `<strong>${p.name}</strong><br/>
           ${p.degreeLevel ?? ""} in ${p.subject ?? "—"}<br/>
           🎓 ${p.university ?? "—"}<br/>
           📍 ${p.city}, ${p.country}`
        )
    );

    // Zoom to fit the filtered pins (with a little padding).
    if (visible.length > 0) {
      map.fitBounds(
        L.latLngBounds(visible.map((p) => [p.lat, p.lng])).pad(0.3),
        { maxZoom: 6 }
      );
    }
  }, [visible]);

  const countries = [...new Set(pins.map((p) => p.country))].sort();

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
        <span className="ml-auto text-sm text-slate-500">
          {visible.length} student{visible.length !== 1 && "s"} shown
        </span>
      </div>

      {/* The map */}
      <div ref={mapDivRef} className="mt-4 h-[65vh] w-full rounded-xl border border-slate-200 shadow-sm" />
    </div>
  );
}
