// SERVICE: free geocoding via OpenStreetMap's Nominatim.
// Usage policy: identify yourself with a User-Agent and max ~1 request/sec —
// we cache every query and only geocode when a profile's location changes,
// so we stay well within the limits.

const cache = new Map(); // query → { lat, lng } | null

export async function geocode(query) {
  if (!query?.trim()) return null;

  const key = query.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "GradBridge/1.0 (university course project)" },
      signal: AbortSignal.timeout(8_000),
    });
    const results = await res.json();
    const hit = results?.[0]
      ? { lat: Number(results[0].lat), lng: Number(results[0].lon) }
      : null;
    cache.set(key, hit);
    return hit;
  } catch {
    return null; // fail-soft: profile saves fine, pin just won't plot yet
  }
}

// Try the most specific query first, then fall back to the city.
export async function geocodePlace({ university, city, country }) {
  return (
    (await geocode([university, city, country].filter(Boolean).join(", "))) ??
    (await geocode([city, country].filter(Boolean).join(", ")))
  );
}
