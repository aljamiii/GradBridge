// SERVICE: live job market data from the Adzuna API (free tier).
// Get free credentials (no card) at https://developer.adzuna.com →
// ADZUNA_APP_ID and ADZUNA_APP_KEY in server/.env.

// Countries Adzuna actually covers (it doesn't have Sweden/Malaysia).
export const ADZUNA_COUNTRIES = {
  Canada: "ca",
  "United Kingdom": "gb",
  Australia: "au",
  "United States": "us",
  Germany: "de",
  Netherlands: "nl",
  "New Zealand": "nz",
  Singapore: "sg",
};

const cache = new Map(); // key → { data, expires }
const TTL_MS = 12 * 60 * 60 * 1000;

export function adzunaConfigured() {
  return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

// Returns { count, avgSalary, currency, sampleJobs } for a field in a country.
export async function getJobStats(country, field) {
  const cc = ADZUNA_COUNTRIES[country];
  if (!cc) throw Object.assign(new Error(`Adzuna doesn't cover ${country}.`), { statusCode: 400 });

  const key = `${cc}|${field.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  // Note: Adzuna rejects requests containing unknown parameters (400),
  // so send exactly what its docs list.
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID,
    app_key: process.env.ADZUNA_APP_KEY,
    what: field,
    results_per_page: "5",
  });
  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${cc}/search/1?${params}`,
    { signal: AbortSignal.timeout(12_000) }
  );
  if (!res.ok) throw new Error(`Adzuna responded ${res.status}`);
  const raw = await res.json();

  // Adzuna returns "mean" — the average advertised salary for the whole
  // query, far better than averaging our 5-result sample.
  const avgSalary = raw.mean ? Math.round(raw.mean) : null;

  const data = {
    count: raw.count ?? 0,
    avgSalary,
    sampleJobs: (raw.results ?? []).slice(0, 3).map((j) => ({
      title: j.title?.replace(/<[^>]+>/g, ""),
      company: j.company?.display_name,
      location: j.location?.display_name,
      url: j.redirect_url,
    })),
  };
  cache.set(key, { data, expires: Date.now() + TTL_MS });
  return data;
}
