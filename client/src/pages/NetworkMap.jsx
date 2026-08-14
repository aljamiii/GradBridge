import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

const selectClass =
  "rounded-xl border border-white/70 bg-white/60 backdrop-blur-sm px-3.5 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none";

// Pulsing sky-blue dot marking a user who is connected right now.
const onlineDotHtml = `<span style="position:absolute;top:-5px;right:-7px;width:12px;height:12px">
    <span class="animate-ping" style="position:absolute;inset:0;border-radius:9999px;background:#38bdf8;opacity:.75"></span>
    <span style="position:absolute;inset:0;border-radius:9999px;background:#0ea5e9;border:2px solid white"></span>
  </span>`;

// A small pin as a divIcon — avoids Leaflet's bundler image issues.
// `online` adds the live-presence dot; `color` lets the fit overlay tint it.
const pinIcon = (online, color = "#16a34a") =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;width:22px;height:22px">
      <div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>
      ${online ? onlineDotHtml : ""}
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });

// Personal-fit colour ramp for the "colour by my fit" overlay.
const fitColor = (score) =>
  score == null ? "#94a3b8" : score >= 70 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#dc2626";
// The compatibility engine's verdict is a sentence about the CITY ("Strong on
// community, weak on budget."), so we always print it after "<city> scores…"
// and lowercase it into that clause — never next to a person's name, where it
// would read as a judgement of them.
const verdictClause = (verdict = "") =>
  verdict.replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase());

// Turn the student's SAVED profile preferences into the 0-10 priority weights
// the compatibility endpoint expects — so the map needs no extra questions.
const weightsFromProfile = (p = {}) => ({
  budget: p.budgetUSD == null ? 5 : p.budgetUSD < 15000 ? 9 : p.budgetUSD < 25000 ? 6 : 4,
  weather: p.weatherTolerance && p.weatherTolerance !== "no-preference" ? 7 : 2,
  community: { high: 9, medium: 5, low: 2 }[p.communityPriority] ?? 5,
  safety: 7, // everyone cares about safety; it never dominates alone
});

// Radius for "click anywhere → who's near that point" (server-side $geoNear).
const PROBE_RADIUS_KM = 100;

// Flag emoji for the countries we commonly see; 🌍 for anything else.
const FLAGS = {
  Canada: "🇨🇦", "United Kingdom": "🇬🇧", Germany: "🇩🇪", Australia: "🇦🇺",
  Malaysia: "🇲🇾", Sweden: "🇸🇪", "United States": "🇺🇸", Japan: "🇯🇵",
  Netherlands: "🇳🇱", Finland: "🇫🇮", Denmark: "🇩🇰", Norway: "🇳🇴",
  France: "🇫🇷", Italy: "🇮🇹", Ireland: "🇮🇪", "New Zealand": "🇳🇿",
};
const flagOf = (country) => FLAGS[country] ?? "🌍";

// "Can help with" vocabulary — must match the User model enum.
const HELP_TOPICS = ["visa", "housing", "funding", "part-time jobs", "admissions", "settling in"];
const HELP_ICONS = {
  visa: "🛂", housing: "🏠", funding: "💰",
  "part-time jobs": "💼", admissions: "🎓", "settling in": "🧭",
};

// Rough local time from longitude (15° ≈ 1 hour). Real timezones bend around
// borders and DST, so it's labeled "~" — good enough for "is it night there?".
const localTimeAt = (lng) => {
  if (lng == null) return null;
  const t = new Date(Date.now() + Math.round(lng / 15) * 3600e3);
  return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
};

// Cluster badge for a city with several students — a circle with the count.
// `anyOnline` marks a cluster containing at least one connected user.
const clusterIcon = (n, anyOnline, color = "#16a34a") =>
  L.divIcon({
    className: "",
    html: `<div style="position:relative;width:34px;height:34px">
      <div style="width:34px;height:34px;border-radius:50%;background:${color};border:3px solid white;
        box-shadow:0 1px 5px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;
        color:white;font-weight:700;font-size:13px">${n}</div>
      ${anyOnline ? onlineDotHtml : ""}
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

// Small × button shown at the city centre while its cluster is fanned out.
const collapseIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#475569;border:2px solid white;
    box-shadow:0 1px 3px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;
    color:white;font-size:12px;line-height:1">×</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// One student profile card in the sidebar — describes the PERSON only.
// (City fit belongs to a place, so it lives on the pin colour and popup.)
// `badge` is optional (e.g. "3.2 km"); `online` shows the live-presence dot;
// `onSayHi` (absent on your own card) renders the peer-chat button.
// Root is a div so the inner button nests legally.
function StudentCard({ s, badge, online, onClick, onSayHi }) {
  return (
    <div role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="w-full cursor-pointer rounded-lg border border-slate-100 bg-white/45 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-semibold text-white">
          {s.name?.[0] ?? "?"}
          {online && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-sky-500"></span>
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-900">{s.name}</p>
          <p className="truncate text-xs text-ink-500">
            {s.degreeLevel ?? "Student"}
            {s.subject ? ` in ${s.subject}` : ""}
          </p>
        </div>
        {badge && (
          <span className="ml-auto shrink-0 text-xs font-medium text-emerald-700">{badge}</span>
        )}
      </div>
      <p className="mt-1.5 truncate text-xs text-ink-500">🎓 {s.university ?? "—"}</p>
      <p className="truncate text-xs text-ink-400">
        📍 {s.city}, {s.country}
        {localTimeAt(s.lng) && ` · 🕐 ~${localTimeAt(s.lng)}`}
      </p>
      {s.helpWith?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {s.helpWith.map((t) => (
            <span key={t}
              className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {HELP_ICONS[t] ?? "🤝"} {t}
            </span>
          ))}
        </div>
      )}
      {onSayHi && (
        <button type="button"
          onClick={(e) => { e.stopPropagation(); onSayHi(); }}
          className="mt-2 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-brand-700">
          👋 Say hi
        </button>
      )}
    </div>
  );
}

export default function NetworkMap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // The Survival Guide's "see them on the Network Map" chip links here with
  // ?country=… so the map opens pre-filtered to that campus's country.
  const [searchParams] = useSearchParams();
  const [pins, setPins] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    country: searchParams.get("country") ?? "all",
    degreeLevel: "all",
    subject: "",
    helpWith: "all",
  });

  const mapDivRef = useRef(null);   // the <div> Leaflet renders into
  const mapRef = useRef(null);      // the Leaflet map instance
  const markersRef = useRef([]);    // every layer we drew (pins, clusters, lines)
  const markersByIdRef = useRef(new Map()); // student id → their marker
  const probeCircleRef = useRef(null); // the radius-search circle

  // Which city cluster is currently fanned out, as "city|country" (or null).
  const [expandedCity, setExpandedCity] = useState(null);

  // Radius search: clicking the map probes "who's within 25 km of here?"
  // { lat, lng, students? } — students undefined while the query runs.
  const [probe, setProbe] = useState(null);

  // Load pins once.
  useEffect(() => {
    api("/api/users/network-map")
      .then((d) => setPins(d.pins))
      .catch((err) => setError(err.message));
  }, []);

  // Tick once a minute so the ~local times on cards stay current.
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // 🎨 "Colour by my fit": reuse the Life Compatibility Score (Module 3) with
  // weights derived from my saved profile, then tint each city by MY fit.
  // The map stops looking the same for everyone.
  const [fitOn, setFitOn] = useState(false);
  const [fitByCity, setFitByCity] = useState(null); // "city|country" → {score, verdict}
  useEffect(() => {
    if (!fitOn || fitByCity) return;
    api("/api/tools/compatibility", {
      method: "POST",
      body: { weights: weightsFromProfile(user?.studentProfile) },
    })
      .then((d) => {
        const byCity = {};
        for (const r of d.results) {
          byCity[`${r.city}|${r.country}`] = { score: r.score, verdict: r.verdict };
        }
        setFitByCity(byCity);
      })
      .catch((err) => { setError(err.message); setFitOn(false); });
  }, [fitOn, fitByCity, user]);

  // Fit lookup for a pin — null when we have no rating for that city.
  const fitOf = (p) => (fitOn ? fitByCity?.[`${p.city}|${p.country}`] ?? null : null);

  // Country stats (DB aggregation) → the clickable chips above the map.
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api("/api/users/network-map/stats").then(setStats).catch(() => {});
  }, []);

  // Live presence over the existing chat socket: fetch who's online now,
  // then keep the set fresh from presence:update broadcasts.
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () =>
      socket.emit("presence:get", (ids) => setOnlineIds(new Set((ids ?? []).map(String))));
    if (socket.connected) refresh();
    socket.on("connect", refresh); // initial connect AND reconnects re-sync
    const onUpdate = ({ userId, online }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    socket.on("presence:update", onUpdate);
    return () => {
      socket.off("presence:update", onUpdate);
      socket.off("connect", refresh);
    };
  }, []);

  // Create the map once (world view centred between Europe and Asia).
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return;
    const map = L.map(mapDivRef.current).setView([30, 40], 2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    // Radius search: any click on open map becomes a probe point.
    map.on("click", (e) => setProbe({ lat: e.latlng.lat, lng: e.latlng.lng }));
    mapRef.current = map;
  }, []);

  // Probe changed → draw the circle and ask the geospatial endpoint who's
  // inside it. Deps are lat/lng only, so storing the results doesn't refetch.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    probeCircleRef.current?.remove();
    probeCircleRef.current = null;
    if (!probe) return;

    probeCircleRef.current = L.circle([probe.lat, probe.lng], {
      radius: PROBE_RADIUS_KM * 1000,
      color: "#4f46e5",
      weight: 1.5,
      fillColor: "#4f46e5",
      fillOpacity: 0.08,
    }).addTo(map);

    api(
      `/api/users/network-map/nearby?lat=${probe.lat}&lng=${probe.lng}&radiusKm=${PROBE_RADIUS_KM}`
    )
      .then((d) => setProbe((p) => (p ? { ...p, students: d.students ?? [] } : p)))
      .catch(() => setProbe((p) => (p ? { ...p, students: [] } : p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probe?.lat, probe?.lng]);

  // Spec: filterable by country, degree, and subject (+ "can help with").
  const visible = useMemo(
    () =>
      pins.filter(
        (p) =>
          (filters.country === "all" || p.country === filters.country) &&
          (filters.degreeLevel === "all" || p.degreeLevel === filters.degreeLevel) &&
          (filters.helpWith === "all" || p.helpWith?.includes(filters.helpWith)) &&
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
         ${onlineIds.has(String(p.id)) ? '<span style="color:#0ea5e9;font-weight:600">● online now</span><br/>' : ""}
         ${p.degreeLevel ?? ""} in ${p.subject ?? "—"}<br/>
         🎓 ${p.university ?? "—"}<br/>
         📍 ${p.city}, ${p.country} · 🕐 ~${localTimeAt(p.lng)}<br/>
         ${p.helpWith?.length ? `🤝 helps with: ${p.helpWith.join(", ")}<br/>` : ""}
         ${fitOf(p) ? `<span style="color:${fitColor(fitOf(p).score)};font-weight:600">🎨 ${p.city} scores ${fitOf(p).score}/100 for you</span> — ${verdictClause(fitOf(p).verdict)}<br/>` : ""}`;
      const link = document.createElement("a");
      link.href = "#";
      link.textContent = "🧭 Explore this area →";
      link.className = "mt-1 inline-block text-sm font-medium text-brand-600 hover:underline";
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
    markersRef.current = [];
    markersByIdRef.current = new Map();

    const addStudentPin = (p, latlng) => {
      const m = L.marker(latlng ?? [p.lat, p.lng], {
        icon: pinIcon(
          onlineIds.has(String(p.id)),
          fitOn ? fitColor(fitOf(p)?.score) : undefined
        ),
      })
        .addTo(map)
        .bindPopup(popupContent(p));
      markersRef.current.push(m);
      markersByIdRef.current.set(String(p.id), m);
    };

    // Hand-rolled clustering: group pins by city; several students in one
    // city render as ONE count badge instead of stacked pins.
    const groups = new Map();
    for (const p of visible) {
      const key = `${p.city}|${p.country}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }

    for (const [key, members] of groups) {
      if (members.length === 1) {
        addStudentPin(members[0]);
        continue;
      }
      const center = [
        members.reduce((sum, p) => sum + p.lat, 0) / members.length,
        members.reduce((sum, p) => sum + p.lng, 0) / members.length,
      ];

      if (expandedCity === key) {
        // Spider-fan: place members in a circle around the city centre.
        // project/unproject at the TARGET zoom so the fan is laid out for
        // where the flyTo lands, not where the camera currently is.
        const fanZoom = Math.max(map.getZoom(), 8);
        const cp = map.project(center, fanZoom);
        members.forEach((p, i) => {
          const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
          const ll = map.unproject(
            L.point(cp.x + 42 * Math.cos(angle), cp.y + 42 * Math.sin(angle)),
            fanZoom
          );
          const leg = L.polyline([center, ll], {
            color: "#94a3b8", weight: 1.5, dashArray: "3 3",
          }).addTo(map);
          markersRef.current.push(leg);
          addStudentPin(p, ll);
        });
        const collapse = L.marker(center, { icon: collapseIcon })
          .addTo(map)
          .on("click", () => setExpandedCity(null));
        markersRef.current.push(collapse);
      } else {
        const cluster = L.marker(center, {
          icon: clusterIcon(
            members.length,
            members.some((m) => onlineIds.has(String(m.id))),
            fitOn ? fitColor(fitOf(members[0])?.score) : undefined
          ),
        })
          .addTo(map)
          .bindTooltip(`${members[0].city} — ${members.length} students`)
          .on("click", () => {
            setExpandedCity(key);
            map.flyTo(center, Math.max(map.getZoom(), 8), { duration: 0.7 });
          });
        markersRef.current.push(cluster);
      }
    }

    // Zoom to fit the filtered pins (skip while a cluster is fanned out —
    // refitting would yank the camera away from the city being inspected).
    if (visible.length > 0 && !expandedCity) {
      map.fitBounds(
        L.latLngBounds(visible.map((p) => [p.lat, p.lng])).pad(0.3),
        { maxZoom: 6 }
      );
    }
  }, [visible, expandedCity, onlineIds, fitOn, fitByCity, navigate]);

  const countries = [...new Set(pins.map((p) => p.country))].sort();

  // ✈️ Fly-to search: geocode a typed place, fly there, run the radius probe.
  const [placeQ, setPlaceQ] = useState("");
  const [placeErr, setPlaceErr] = useState("");
  const flyToPlace = async (e) => {
    e.preventDefault();
    const q = placeQ.trim();
    if (!q) return;
    setPlaceErr("");
    try {
      const d = await api(`/api/users/network-map/geocode?q=${encodeURIComponent(q)}`);
      mapRef.current?.flyTo([d.lat, d.lng], 7, { duration: 1 });
      setProbe({ lat: d.lat, lng: d.lng }); // draws the circle + runs $geoNear
    } catch (err) {
      setPlaceErr(err.message);
    }
  };

  // 👋 Say hi: open (or find) a peer conversation and jump into the thread.
  const sayHi = async (s) => {
    try {
      const d = await api("/api/chat/start", { method: "POST", body: { userId: s.id } });
      navigate(`/chat?c=${d.conversationId}`);
    } catch (err) {
      setError(err.message);
    }
  };
  const isMe = (s) => String(s.id) === String(user?.id ?? "");

  // Sidebar card → fly the map to that student's pin and open its popup.
  // Students hidden inside a cluster (or filtered out) have no marker yet:
  // expand their city's fan and fly there instead.
  const focusStudent = (s) => {
    const map = mapRef.current;
    if (!map) return;
    const marker = markersByIdRef.current.get(String(s.id));
    if (marker) {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 6), { duration: 0.8 });
      marker.openPopup();
    } else {
      setExpandedCity(`${s.city}|${s.country}`);
      if (s.lat != null) {
        map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 8), { duration: 0.8 });
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="animate-rise text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">Bangladeshi Abroad Network</h1>
      <p className="mt-1 text-ink-500">
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
        <select value={filters.helpWith}
          onChange={(e) => setFilters({ ...filters, helpWith: e.target.value })}
          className={selectClass}>
          <option value="all">Can help with…</option>
          {HELP_TOPICS.map((t) => (
            <option key={t} value={t}>{HELP_ICONS[t]} {t}</option>
          ))}
        </select>

        {/* Fly-to search: think in city names, not clicks */}
        <form onSubmit={flyToPlace} className="ml-auto flex items-center gap-2">
          <input value={placeQ} placeholder='Fly to a city… (e.g., "Frankfurt")'
            onChange={(e) => setPlaceQ(e.target.value)}
            className={selectClass} />
          <button type="submit"
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700">
            ✈️ Go
          </button>
        </form>
        {placeErr && <span className="w-full text-xs text-red-500">{placeErr}</span>}

        <button type="button" onClick={() => setFitOn((v) => !v)}
          title="Colours each city by YOUR Life Compatibility Score"
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            fitOn
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
          }`}>
          🎨 Colour by my fit
        </button>
      </div>

      {fitOn && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
          <span>
            Pins coloured by how well each <b>city</b> suits your saved
            priorities — open a pin for its score:
          </span>
          {[["#16a34a", "strong fit (70+)"], ["#f59e0b", "mixed (50-69)"], ["#dc2626", "weak (<50)"], ["#94a3b8", "not rated"]].map(
            ([c, label]) => (
              <span key={label} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                {label}
              </span>
            )
          )}
        </div>
      )}

      {/* Country chips — computed by a $group aggregation; click = filter + zoom */}
      {stats?.countries?.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button"
            onClick={() => { setFilters({ ...filters, country: "all" }); setProbe(null); }}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              filters.country === "all"
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
            }`}>
            🌍 All <b>{stats.total}</b>
          </button>
          {stats.countries.map((c) => (
            <button key={c.country} type="button"
              onClick={() => {
                setFilters({
                  ...filters,
                  country: filters.country === c.country ? "all" : c.country,
                });
                setProbe(null); // chips answer "who's THERE" — drop any probe
              }}
              title={`${c.cities} cit${c.cities === 1 ? "y" : "ies"}`}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                filters.country === c.country
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-brand-400"
              }`}>
              {flagOf(c.country)} {c.country} <b>{c.students}</b>
            </button>
          ))}
        </div>
      )}

      {/* Map + a sidebar of profile cards mirroring the current filters */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div ref={mapDivRef}
          className="h-[65vh] w-full rounded-xl border border-slate-200 shadow-sm lg:flex-1" />

        <aside className="flex w-full shrink-0 flex-col glass-card rounded-2xl p-4 shadow-sm lg:h-[65vh] lg:w-72">
          {probe ? (
            <>
              <h2 className="flex items-center gap-2 font-semibold text-ink-900">
                📍 Near this spot
                <span className="ml-auto text-xs font-normal text-ink-400">
                  {probe.students ? `${probe.students.length} found` : "searching…"}
                </span>
              </h2>
              <button type="button" onClick={() => setProbe(null)}
                className="mt-1 self-start text-xs text-brand-600 hover:underline">
                ✕ Clear — back to all students
              </button>

              {probe.students && probe.students.length === 0 && (
                <p className="mt-3 text-sm text-ink-400">
                  No students within {PROBE_RADIUS_KM} km of that point — try
                  clicking closer to a green pin.
                </p>
              )}
              {probe.students && probe.students.length > 0 && (
                <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
                  {probe.students.map((s) => (
                    <li key={s.id}>
                      <StudentCard s={s} badge={`${s.distanceKm} km`}
                        online={onlineIds.has(String(s.id))}
                        onSayHi={isMe(s) ? undefined : () => sayHi(s)}
                        onClick={() => focusStudent(s)} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <h2 className="flex items-center gap-2 font-semibold text-ink-900">
                🎓 Students
                <span className="ml-auto text-xs font-normal text-ink-400">
                  {visible.length} shown
                  {(() => {
                    const n = visible.filter((p) => onlineIds.has(String(p.id))).length;
                    return n > 0 ? ` · ${n} online` : "";
                  })()}
                </span>
              </h2>
              <p className="mt-1 text-xs text-ink-400">
                💡 Click anywhere on the map to find students near that point.
              </p>

              {visible.length === 0 ? (
                <p className="mt-3 text-sm text-ink-400">
                  No students match these filters yet — try widening them, or opt in
                  from your Profile page if you're already abroad.
                </p>
              ) : (
                <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
                  {visible.map((p) => (
                    <li key={p.id}>
                      <StudentCard s={p} online={onlineIds.has(String(p.id))}
                        onSayHi={isMe(p) ? undefined : () => sayHi(p)}
                        onClick={() => focusStudent(p)} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
