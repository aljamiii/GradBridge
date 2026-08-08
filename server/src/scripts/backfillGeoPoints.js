// One-off: mirror existing abroad lat/lng into GeoJSON `location` so the
// 2dsphere index covers pins created before the geospatial upgrade.
// (New/updated profiles get `location` set automatically in updateProfile.)
//   cd server && node src/scripts/backfillGeoPoints.js
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

await mongoose.connect(process.env.MONGO_URI);
await User.createIndexes(); // make sure the 2dsphere index exists

// Pipeline update: MongoDB builds each doc's Point from its own lat/lng —
// one statement, no fetch-and-loop. [lng, lat] order per the GeoJSON spec.
const result = await User.updateMany(
  {
    "studentProfile.abroad.lat": { $ne: null },
    "studentProfile.abroad.location.type": { $exists: false },
  },
  [
    {
      $set: {
        "studentProfile.abroad.location": {
          type: "Point",
          coordinates: ["$studentProfile.abroad.lng", "$studentProfile.abroad.lat"],
        },
      },
    },
  ],
  { updatePipeline: true } // mongoose 9: opt in to aggregation-pipeline updates
);

console.log(`✅ Backfilled ${result.modifiedCount} student pin(s) with GeoJSON points.`);
await mongoose.disconnect();
process.exit(0);
