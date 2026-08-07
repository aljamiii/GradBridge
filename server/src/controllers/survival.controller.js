// CONTROLLER: Housing & Survival Guide (Module 1 #4).
// Given a university address → nearby mosques, halal food, hospitals,
// and transit stops, sorted by distance.
import { geocode } from "../services/geocode.js";
import { findNearbyEssentials } from "../services/overpass.js";

const cache = new Map(); // rounded coords → { data, expires }
const TTL_MS = 24 * 60 * 60 * 1000; // POIs don't move often

// GET /api/survival-guide?q=University of Toronto
export const getSurvivalGuide = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 3) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a university name or address." });
    }

    const coords = await geocode(q);
    if (!coords) {
      return res.status(404).json({
        success: false,
        message: `Couldn't locate "${q}" — try adding the city (e.g., "University of Toronto, Canada").`,
      });
    }

    // Round coordinates so tiny geocode differences share one cache entry.
    const key = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) {
      return res.json({ success: true, cached: true, query: q, ...hit.data });
    }

    const places = await findNearbyEssentials(coords.lat, coords.lng);

    const data = { center: coords, places };
    cache.set(key, { data, expires: Date.now() + TTL_MS });

    res.json({ success: true, cached: false, query: q, ...data });
  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "The map data service is slow right now — try again in a minute.",
      });
    }
    next(err);
  }
};
