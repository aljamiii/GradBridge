// SERVICE: live weather from OpenWeather (free tier).
// FAIL-SOFT by design: if the key is missing/not yet activated or the API is
// down, we return null and the destination advisor simply answers without
// live weather — never crash a whole answer over a weather chip.

const cache = new Map(); // city → { data, expires }
const TTL_MS = 30 * 60 * 1000;

export async function getWeather(city) {
  if (!process.env.OPENWEATHER_API_KEY || !city) return null;

  const key = city.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
    const raw = await res.json();
    if (raw.cod !== 200) return null;

    const data = {
      city: raw.name,
      tempC: Math.round(raw.main.temp),
      feelsLikeC: Math.round(raw.main.feels_like),
      description: raw.weather?.[0]?.description ?? "",
      humidity: raw.main.humidity,
    };
    cache.set(key, { data, expires: Date.now() + TTL_MS });
    return data;
  } catch {
    return null; // fail-soft
  }
}
