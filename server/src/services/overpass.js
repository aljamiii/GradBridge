// SERVICE: nearby points of interest from OpenStreetMap's Overpass API
// (free, no key). Finds what a Bangladeshi student needs on day one:
// mosques, halal food, hospitals, and transit stops around campus.

// Public Overpass instances — if the first is busy (it often is), try the next.
const OVERPASS_INSTANCES = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Straight-line distance between two coordinates, in km (haversine formula).
export const distanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Decide which of our categories an OSM element belongs to.
const categorize = (tags) => {
  if (tags.amenity === "place_of_worship" && tags.religion === "muslim") return "mosques";
  if (/yes|only/.test(tags["diet:halal"] ?? "")) return "halal";
  if (tags.amenity === "hospital") return "hospitals";
  if (tags.public_transport === "station" || tags.railway === "station" || tags.highway === "bus_stop")
    return "transit";
  return null;
};

const CATEGORY_LIMIT = 8; // closest N per category

export async function findNearbyEssentials(lat, lng) {
  // One combined query: 3km for mosques/halal/hospitals, 1.2km for transit
  // (cities have hundreds of bus stops — only very nearby ones matter).
  const query = `
[out:json][timeout:25];
(
  nwr(around:3000,${lat},${lng})["amenity"="place_of_worship"]["religion"="muslim"];
  nwr(around:3000,${lat},${lng})["diet:halal"~"yes|only"];
  nwr(around:3000,${lat},${lng})["amenity"="hospital"];
  nwr(around:1200,${lat},${lng})["public_transport"="station"];
  nwr(around:1200,${lat},${lng})["railway"="station"];
  nwr(around:800,${lat},${lng})["highway"="bus_stop"];
);
out center 250;`;

  let data = null;
  let lastStatus = null;
  for (const instance of OVERPASS_INSTANCES) {
    try {
      const res = await fetch(instance, {
        method: "POST",
        headers: {
          // Overpass blocks anonymous default agents — identify ourselves.
          "User-Agent": "GradBridge/1.0 (university course project)",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        data = await res.json();
        break;
      }
      lastStatus = res.status;
    } catch {
      lastStatus = "timeout";
    }
  }
  if (!data) throw new Error(`All Overpass instances busy (last: ${lastStatus})`);

  const results = { mosques: [], halal: [], hospitals: [], transit: [] };

  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const category = categorize(tags);
    if (!category) continue;

    // Nodes carry lat/lon directly; ways/relations carry a computed "center".
    const pLat = el.lat ?? el.center?.lat;
    const pLng = el.lon ?? el.center?.lon;
    if (pLat == null) continue;

    results[category].push({
      name: tags.name || tags["name:en"] || "(unnamed)",
      lat: pLat,
      lng: pLng,
      distanceKm: Math.round(distanceKm(lat, lng, pLat, pLng) * 100) / 100,
      detail:
        tags["addr:street"] ||
        tags.cuisine?.replaceAll(";", ", ") ||
        tags.operator ||
        "",
    });
  }

  // Sort each category by distance (spec), dedupe by name, cap the list.
  for (const key of Object.keys(results)) {
    const seen = new Set();
    results[key] = results[key]
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .filter((p) => {
        const k = p.name.toLowerCase();
        if (p.name !== "(unnamed)" && seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, CATEGORY_LIMIT);
  }

  return results;
}
