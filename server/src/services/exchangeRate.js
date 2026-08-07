// SERVICE: live currency rates from open.er-api.com (free, no API key).
// Rates barely move hour to hour, so we cache for 12 hours.

let cached = null; // { rates, expires }
const TTL_MS = 12 * 60 * 60 * 1000;

// Returns e.g. { BDT: 117.5, CAD: 1.36, EUR: 0.92, ... } — all relative to 1 USD.
export async function getRatesUSD() {
  if (cached && cached.expires > Date.now()) return cached.rates;

  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Exchange rate API responded ${res.status}`);
  const data = await res.json();
  if (data.result !== "success") throw new Error("Exchange rate API returned an error");

  cached = { rates: data.rates, expires: Date.now() + TTL_MS };
  return data.rates;
}
