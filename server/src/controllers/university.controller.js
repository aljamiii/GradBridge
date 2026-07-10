// CONTROLLER: university search via the free Hipolabs API.
// We proxy through our backend instead of calling it from React because:
//   1. no CORS problems, 2. we can cache results, 3. one place to handle errors.

const HIPOLABS = "http://universities.hipolabs.com/search";

// Tiny in-memory cache: identical searches within 1 hour are served instantly
// without hitting the external API again. (Your spec: "results are cached".)
const cache = new Map(); // key → { data, expires }
const CACHE_TTL_MS = 60 * 60 * 1000;

// GET /api/universities/search?name=toronto&country=canada
export const searchUniversities = async (req, res, next) => {
  try {
    const name = (req.query.name || "").trim();
    const country = (req.query.country || "").trim();

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

    // Reshape into clean fields our frontend needs (cap at 50 results).
    const universities = raw.slice(0, 50).map((u) => ({
      name: u.name,
      country: u.country,
      stateProvince: u["state-province"] || null,
      website: u.web_pages?.[0] || null,
      domain: u.domains?.[0] || null,
    }));

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
