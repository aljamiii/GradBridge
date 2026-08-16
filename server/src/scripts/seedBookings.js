// Seed script: past booking history so each mentor's track record (sessions
// completed, confirm rate, typical response time) has something real to
// compute from. Those stats are derived, never self-reported — this just gives
// them a history to derive from.
//
// Usage, from the server/ folder:
//   node src/scripts/seedBookings.js
//
// Idempotent: deletes only the bookings it previously created (tagged by a
// topic prefix) before re-creating them, so re-running never piles up.
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const TAG = "[seed]";
const hours = (n) => n * 3600 * 1000;
const days = (n) => n * 24 * hours(1);

// email → how this mentor behaves. `answers` is a list of past requests:
// hoursToAnswer = null means they never replied (still pending).
const HISTORY = {
  // Fast, reliable, busy — the profile a student wants to see.
  "tanjina.mentor@gradbridge.dev": {
    answers: [
      { agoDays: 40, hoursToAnswer: 2, status: "confirmed", topic: "SOP structure review" },
      { agoDays: 33, hoursToAnswer: 3, status: "confirmed", topic: "Waterloo application plan" },
      { agoDays: 26, hoursToAnswer: 1, status: "confirmed", topic: "ML research statement" },
      { agoDays: 18, hoursToAnswer: 4, status: "confirmed", topic: "Scholarship shortlist" },
      { agoDays: 11, hoursToAnswer: 2, status: "declined", topic: "Mock interview" },
      { agoDays: 5, hoursToAnswer: 3, status: "confirmed", topic: "Funding options" },
    ],
  },
  // Experienced but slower to reply.
  "mahmudul.mentor@gradbridge.dev": {
    answers: [
      { agoDays: 45, hoursToAnswer: 30, status: "confirmed", topic: "US F1 interview prep" },
      { agoDays: 30, hoursToAnswer: 44, status: "confirmed", topic: "RA position search" },
      { agoDays: 20, hoursToAnswer: 26, status: "declined", topic: "Weekend session request" },
      { agoDays: 9, hoursToAnswer: 36, status: "confirmed", topic: "Computer vision reading list" },
    ],
  },
  // Selective: declines a lot, which the confirm rate should show honestly.
  "rafiul.mentor@gradbridge.dev": {
    answers: [
      { agoDays: 38, hoursToAnswer: 8, status: "declined", topic: "General chat" },
      { agoDays: 29, hoursToAnswer: 6, status: "confirmed", topic: "Blocked account walkthrough" },
      { agoDays: 21, hoursToAnswer: 9, status: "declined", topic: "CV review" },
      { agoDays: 12, hoursToAnswer: 7, status: "declined", topic: "Unrelated topic" },
    ],
  },
  "shafiqul.mentor@gradbridge.dev": {
    answers: [
      { agoDays: 35, hoursToAnswer: 12, status: "confirmed", topic: "Alberta admissions timeline" },
      { agoDays: 24, hoursToAnswer: 14, status: "confirmed", topic: "SOP review" },
      { agoDays: 13, hoursToAnswer: 10, status: "confirmed", topic: "Document checklist" },
    ],
  },
  "imran.mentor@gradbridge.dev": {
    answers: [
      { agoDays: 28, hoursToAnswer: 20, status: "confirmed", topic: "UK visa documents" },
      { agoDays: 16, hoursToAnswer: 18, status: "confirmed", topic: "Part-time work rules" },
      { agoDays: 6, hoursToAnswer: null, status: "pending", topic: "London housing" },
    ],
  },
  // Exactly two answers — below the threshold, so no rate should be shown.
  "sadia.mentor@gradbridge.dev": {
    answers: [
      { agoDays: 22, hoursToAnswer: 5, status: "confirmed", topic: "Montreal settling in" },
      { agoDays: 8, hoursToAnswer: 6, status: "confirmed", topic: "Healthcare career paths" },
    ],
  },
  // Farhana and Ayesha are left with no history on purpose: the UI must have
  // an honest "new mentor" state, not a blank space.
};

await mongoose.connect(process.env.MONGO_URI);

const student = await User.findOne({ role: "student" });
if (!student) {
  console.error("No student found to attach bookings to.");
  process.exit(1);
}

const removed = await Booking.deleteMany({ topic: { $regex: `^\\${TAG}` } });
console.log(`🧹 cleared ${removed.deletedCount} previously seeded bookings\n`);

let created = 0;
for (const [email, plan] of Object.entries(HISTORY)) {
  const mentor = await User.findOne({ email });
  if (!mentor) {
    console.log(`⚠️  skipped ${email} (not found — run seedMentors.js first)`);
    continue;
  }

  for (const a of plan.answers) {
    const createdAt = new Date(Date.now() - days(a.agoDays));
    const start = new Date(createdAt.getTime() + days(3)); // requested 3 days out
    const respondedAt =
      a.hoursToAnswer === null ? undefined : new Date(createdAt.getTime() + hours(a.hoursToAnswer));

    // Timestamps are set explicitly, so bypass the automatic ones.
    await Booking.collection.insertOne({
      student: student._id,
      mentor: mentor._id,
      start,
      durationMins: 30,
      topic: `${TAG} ${a.topic}`,
      status: a.status,
      ...(respondedAt ? { respondedAt } : {}),
      createdAt,
      updatedAt: respondedAt ?? createdAt,
      __v: 0,
    });
    created++;
  }
  console.log(`✅ ${mentor.name.padEnd(17)} ${plan.answers.length} past requests`);
}

console.log(`\n${created} bookings created for ${student.name}.`);
await mongoose.disconnect();
process.exit(0);
