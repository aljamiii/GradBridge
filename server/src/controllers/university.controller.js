// CONTROLLER: university search via the free Hipolabs API.
// We proxy through our backend instead of calling it from React because:
//   1. no CORS problems, 2. we can cache results, 3. one place to handle errors.

import popularUniversities from "../data/popularUniversities.js";

const HIPOLABS = "http://universities.hipolabs.com/search";

// Hipolabs only knows official country names ("United States", not "usa").
// Map the short forms students actually type to the official name.
const COUNTRY_ALIASES = {
  usa: "United States",
  us: "United States",
  america: "United States",
  "united states of america": "United States",
  uk: "United Kingdom",
  britain: "United Kingdom",
  "great britain": "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  uae: "United Arab Emirates",
  "south korea": "Korea, Republic of",
  korea: "Korea, Republic of",
  russia: "Russian Federation",
  iran: "Iran, Islamic Republic of",
  czechia: "Czech Republic",
  holland: "Netherlands",
};

// Tiny in-memory cache: identical searches within 1 hour are served instantly
// without hitting the external API again. (Your spec: "results are cached".)
const cache = new Map(); // key → { data, expires }
const CACHE_TTL_MS = 60 * 60 * 1000;

// GET /api/universities/search?name=toronto&country=canada
export const searchUniversities = async (req, res, next) => {
  try {
    const name = (req.query.name || "").trim();
    let country = (req.query.country || "").trim();

    // "usa" → "United States", "uk" → "United Kingdom", etc.
    country = COUNTRY_ALIASES[country.toLowerCase()] ?? country;

    if (!name && !country) {
      return res
        .status(400)
        .json({ success: false, message: "Provide a university name or a country." });
    }

    const key = `${name.toLowerCase()}|${country.toLowerCase()}`;
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) {
      return res.json({ success: true, cached: true, count: hit.data.length, universities: hit.data });
    }

    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (country) params.set("country", country);

    // Don't hang forever if the free API is having a bad day.
    const response = await fetch(`${HIPOLABS}?${params}`, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Universities API responded ${response.status}`);
    const raw = await response.json();

    // Reshape into clean fields our frontend needs.
    let universities = raw.map((u) => ({
      name: u.name,
      country: u.country,
      stateProvince: u["state-province"] || null,
      website: u.web_pages?.[0] || null,
      domain: u.domains?.[0] || null,
    }));

    // Country search: float curated "popular" universities to the top
    // (Hipolabs has no ranking data). Must happen BEFORE the 50-result cap.
    const popularList = popularUniversities[country.toLowerCase()] ?? [];
    if (popularList.length) {
      const rank = new Map(popularList.map((n, i) => [n.toLowerCase(), i]));
      universities = universities
        .map((u) => ({ ...u, popular: rank.has(u.name.toLowerCase()) }))
        .sort((a, b) => {
          const ra = rank.get(a.name.toLowerCase()) ?? Infinity;
          const rb = rank.get(b.name.toLowerCase()) ?? Infinity;
          return ra - rb;
        });
    }

    universities = universities.slice(0, 50);

    cache.set(key, { data: universities, expires: Date.now() + CACHE_TTL_MS });

    res.json({ success: true, cached: false, count: universities.length, universities });
  } catch (err) {
    // Timeout or network failure → friendly message, not a crash.
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "The universities service is slow right now. Please try again.",
      });
    }
    next(err);
  }
};
