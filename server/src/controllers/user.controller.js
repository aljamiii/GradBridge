// CONTROLLER: profile management (FR #3) + network-map queries.
// The logged-in user updates their own role-specific profile.
import User from "../models/User.js";
import { geocode, geocodePlace } from "../services/geocode.js";

// Shape the user object we send back (same as auth controller).
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  studentProfile: user.studentProfile,
  mentorProfile: user.mentorProfile,
});

// PUT /api/users/profile  (protect middleware already loaded req.user)
export const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, phone, studentProfile, mentorProfile } = req.body;

    // Basic details anyone can change:
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    // Role-specific: students may only edit studentProfile, mentors only mentorProfile.
    if (user.role === "student" && studentProfile) {
      // Merge so a partial update doesn't wipe fields the form didn't send.
      const merged = { ...user.studentProfile?.toObject?.(), ...studentProfile };

      // Network map: if the abroad location changed (or was never geocoded),
      // look up its coordinates via the free Nominatim geocoder.
      const abroad = merged.abroad;
      const prev = user.studentProfile?.abroad;
      if (abroad?.optIn && abroad.city && abroad.country) {
        const moved =
          abroad.city !== prev?.city ||
          abroad.country !== prev?.country ||
          abroad.university !== prev?.university;
        if (moved || abroad.lat == null) {
          const coords = await geocodePlace(abroad);
          abroad.lat = coords?.lat ?? null;
          abroad.lng = coords?.lng ?? null;
        }
        // Mirror into GeoJSON so the 2dsphere index stays in sync
        // ([lng, lat] order — GeoJSON spec, opposite of lat/lng).
        abroad.location =
          abroad.lat != null
            ? { type: "Point", coordinates: [abroad.lng, abroad.lat] }
            : undefined;
      }

      user.studentProfile = merged;
    }
    if (user.role === "mentor" && mentorProfile) {
      const merged = { ...user.mentorProfile?.toObject?.(), ...mentorProfile };
      // verificationStatus is admin-only — never trust it from the client (FR #2).
      merged.verificationStatus = user.mentorProfile?.verificationStatus ?? "pending";
      user.mentorProfile = merged;
    }

    await user.save(); // runs schema validation (e.g., CGPA 0-4)

    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstMessage });
    }
    next(err);
  }
};

// GET /api/users/network-map — pins for verified, opted-in students abroad.
// Spec (Module 1 #3): plotted by city/university, filterable by country,
// degree, and subject (filtering happens client-side on this data).
export const getNetworkMap = async (req, res, next) => {
  try {
    const students = await User.find({
      role: "student",
      "studentProfile.abroad.optIn": true,
      "studentProfile.abroad.lat": { $ne: null },
    }).select("name studentProfile.abroad");

    res.json({
      success: true,
      count: students.length,
      pins: students.map((s) => {
        const a = s.studentProfile.abroad;
        return {
          id: s._id,
          name: s.name,
          city: a.city,
          country: a.country,
          university: a.university,
          degreeLevel: a.degreeLevel,
          subject: a.subject,
          helpWith: a.helpWith ?? [],
          lat: a.lat,
          lng: a.lng,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/network-map/stats — students per country, computed by the
// DB (aggregation pipeline, same philosophy as the forum insights): count
// plus how many distinct cities, sorted by presence.
export const getNetworkStats = async (req, res, next) => {
  try {
    const countries = await User.aggregate([
      {
        $match: {
          role: "student",
          "studentProfile.abroad.optIn": true,
          "studentProfile.abroad.lat": { $ne: null },
        },
      },
      {
        $group: {
          _id: "$studentProfile.abroad.country",
          students: { $sum: 1 },
          cities: { $addToSet: "$studentProfile.abroad.city" },
        },
      },
      { $project: { _id: 0, country: "$_id", students: 1, cities: { $size: "$cities" } } },
      { $sort: { students: -1, country: 1 } },
    ]);

    res.json({
      success: true,
      total: countries.reduce((sum, c) => sum + c.students, 0),
      countries,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/network-map/geocode?q=  — resolve a typed place name so the
// map can fly there and run the radius probe. Proxies Nominatim through the
// cached geocode service (API pattern: keys/CORS/caching all server-side).
export const geocodeSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(400).json({ success: false, message: "Type a place to search." });
    }
    const hit = await geocode(q);
    if (!hit) {
      return res
        .status(404)
        .json({ success: false, message: `Couldn't find "${q}" — try "city, country".` });
    }
    res.json({ success: true, lat: hit.lat, lng: hit.lng });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/network-map/nearby?lat=&lng=&radiusKm=
// Geospatial cross-link (used by the Survival Guide's "students here" chip):
// which opted-in students live near a given point? $geoNear runs on the
// 2dsphere index — the DB finds, filters, and distance-sorts; no JS scanning.
export const getNearbyStudents = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Math.min(100, Number(req.query.radiusKm) || 10);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ success: false, message: "lat and lng are required." });
    }

    const students = await User.aggregate([
      {
        // $geoNear must be the FIRST pipeline stage (it reads the index).
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] }, // GeoJSON: [lng, lat]
          key: "studentProfile.abroad.location",
          distanceField: "distanceMeters",
          maxDistance: radiusKm * 1000,
          query: {
            role: "student",
            "studentProfile.abroad.optIn": true,
            _id: { $ne: req.user._id }, // "students here" shouldn't count yourself
          },
        },
      },
      { $limit: 20 },
      { $project: { name: 1, "studentProfile.abroad": 1, distanceMeters: 1 } },
    ]);

    res.json({
      success: true,
      count: students.length,
      students: students.map((s) => {
        const a = s.studentProfile.abroad;
        return {
          id: s._id,
          name: s.name,
          city: a.city,
          country: a.country,
          university: a.university,
          degreeLevel: a.degreeLevel,
          subject: a.subject,
          helpWith: a.helpWith ?? [],
          lat: a.lat, // so callers can plot these students on their own map
          lng: a.lng,
          distanceKm: Math.round(s.distanceMeters / 100) / 10,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};
