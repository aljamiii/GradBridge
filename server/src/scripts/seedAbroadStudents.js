// One-off script: create demo "already abroad" students for the network map.
//   cd server && node src/scripts/seedAbroadStudents.js
// Safe to re-run: skips accounts that already exist.
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const DEMO = [
  { name: "Nusrat Jahan", city: "Toronto", country: "Canada", university: "University of Toronto", degreeLevel: "Masters", subject: "Computer Science", lat: 43.6629, lng: -79.3957 },
  { name: "Fahim Rahman", city: "Vancouver", country: "Canada", university: "University of British Columbia", degreeLevel: "PhD", subject: "Electrical Engineering", lat: 49.2606, lng: -123.246 },
  { name: "Sadia Islam", city: "London", country: "United Kingdom", university: "Queen Mary University of London", degreeLevel: "Masters", subject: "Data Science", lat: 51.5246, lng: -0.0384 },
  { name: "Tanvir Ahmed", city: "Manchester", country: "United Kingdom", university: "University of Manchester", degreeLevel: "Masters", subject: "Mechanical Engineering", lat: 53.4668, lng: -2.2339 },
  { name: "Mehnaz Chowdhury", city: "Berlin", country: "Germany", university: "Technische Universität Berlin", degreeLevel: "Masters", subject: "Computer Science", lat: 52.5125, lng: 13.3269 },
  { name: "Rakib Hasan", city: "Melbourne", country: "Australia", university: "Monash University", degreeLevel: "PhD", subject: "Public Health", lat: -37.9105, lng: 145.1362 },
  { name: "Farhana Akter", city: "Kuala Lumpur", country: "Malaysia", university: "University of Malaya", degreeLevel: "Bachelors", subject: "Business Administration", lat: 3.1204, lng: 101.6538 },
  { name: "Imran Kabir", city: "Stockholm", country: "Sweden", university: "KTH Royal Institute of Technology", degreeLevel: "Masters", subject: "Machine Learning", lat: 59.3498, lng: 18.0707 },
];

await mongoose.connect(process.env.MONGO_URI);
console.log("🍃 Connected. Seeding abroad students...");

for (const d of DEMO) {
  const email = `${d.name.toLowerCase().replace(/\s+/g, ".")}@demo.gradbridge.dev`;
  const exists = await User.findOne({ email });
  if (exists) {
    console.log(`  ↺ exists: ${d.name}`);
    continue;
  }
  await User.create({
    name: d.name,
    email,
    password: "demo12345",
    role: "student",
    studentProfile: {
      abroad: {
        optIn: true,
        city: d.city,
        country: d.country,
        university: d.university,
        degreeLevel: d.degreeLevel,
        subject: d.subject,
        lat: d.lat,
        lng: d.lng,
      },
    },
  });
  console.log(`  ✔ ${d.name} — ${d.university}, ${d.city}`);
}

console.log("✅ Done.");
await mongoose.disconnect();
process.exit(0);
