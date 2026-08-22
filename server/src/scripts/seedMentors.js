// Seed script: a realistic bench of approved mentors so the rule-based
// matcher has something to actually rank.
//
// Usage, from the server/ folder:
//   node src/scripts/seedMentors.js [password]
//
// Idempotent: re-running updates the same accounts (matched by email) rather
// than creating duplicates.
//
// The roster is deliberately spread across countries and degrees so the
// ranking is visible. Against a student profile of
// "Canada" + "Machine Learning" + "BSc in CSE, BRAC University"
// the matcher tokenizes to {canada, machine, learning, cse, brac} and these
// mentors land on scores from 5 down to 0 — including mentors who match on
// the *degree background* criterion, which no existing mentor did.
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]); // same DNS fix as config/db.js

const password = process.argv[2] || "mentor12345";

// `country` is what the matcher compares against the student's preferred
// country — an exact field, not a word scraped out of the expertise tags.
const MENTORS = [
  {
    name: "Tanjina Rahman",
    email: "tanjina.mentor@gradbridge.dev",
    qualification: "PhD candidate, ex-BRAC CSE",
    university: "University of Waterloo",
    country: "Canada",
    city: "Waterloo",
    expertise: ["Machine Learning", "Canada visas", "Scholarships"],
    availability: "Fridays 7-9pm BD time",
  },
  {
    name: "Mahmudul Karim",
    email: "mahmudul.mentor@gradbridge.dev",
    qualification: "PhD in Computer Vision",
    university: "Purdue University",
    country: "United States",
    city: "West Lafayette",
    expertise: ["Machine Learning", "US F1 visa", "Research assistantship"],
    availability: "Saturdays 9-11pm BD time",
  },
  {
    name: "Rafiul Hasan",
    email: "rafiul.mentor@gradbridge.dev",
    qualification: "MSc in Artificial Intelligence",
    university: "Technical University of Munich",
    country: "Germany",
    city: "Munich",
    expertise: ["Machine Learning", "Germany blocked account", "Research funding"],
    availability: "Sundays 8-10pm BD time",
  },
  {
    name: "Shafiqul Alam",
    email: "shafiqul.mentor@gradbridge.dev",
    qualification: "MSc in CSE",
    university: "University of Alberta",
    country: "Canada",
    city: "Edmonton",
    expertise: ["Canada visas", "Admissions", "SOP review"],
    availability: "Weekdays 10-11pm BD time",
  },
  {
    name: "Sadia Islam",
    email: "sadia.mentor@gradbridge.dev",
    qualification: "MSc in Public Health",
    university: "McGill University",
    country: "Canada",
    city: "Montreal",
    expertise: ["Canada visas", "Settling in", "Healthcare careers"],
    availability: "Saturdays 6-8pm BD time",
  },
  {
    name: "Imran Kabir",
    email: "imran.mentor@gradbridge.dev",
    qualification: "MSc in Data Science",
    university: "University College London",
    country: "United Kingdom",
    city: "London",
    expertise: ["UK student visa", "SOP review", "Part-time work"],
    availability: "Sundays 7-9pm BD time",
  },
  {
    name: "Farhana Akter",
    email: "farhana.mentor@gradbridge.dev",
    qualification: "MSc in Information Systems",
    university: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    expertise: ["Australia PR points", "IELTS prep", "Part-time jobs"],
    availability: "Fridays 5-7pm BD time",
  },
  {
    name: "Ayesha Siddiqua",
    email: "ayesha.mentor@gradbridge.dev",
    qualification: "MSc in Sustainable Energy",
    university: "KTH Royal Institute of Technology",
    country: "Sweden",
    city: "Stockholm",
    expertise: ["Sweden residence permit", "Scholarships", "Settling in"],
    availability: "Saturdays 4-6pm BD time",
  },
  // The two mentors that predate this script, included so the whole visible
  // bench has a country and the script is the one place that defines it.
  {
    name: "Nafisa Haque",
    email: "mentor100@gmail.com",
    qualification: "PhD in Machine Learning",
    university: "University of British Columbia",
    country: "Canada",
    city: "Vancouver",
    expertise: ["Machine Learning", "Canada visas", "Research funding"],
    availability: "Sundays 9-11pm BD time",
  },
  {
    name: "Rahim Ahmed",
    email: "rahim.mentor@test.com",
    qualification: "MSc in Computer Science",
    university: "University of Toronto",
    country: "Canada",
    city: "Toronto",
    expertise: ["SOP review", "Canada visas"],
    availability: "Weekends 8-10pm BD time",
  },
];

await mongoose.connect(process.env.MONGO_URI);

for (const m of MENTORS) {
  const mentorProfile = {
    qualification: m.qualification,
    university: m.university,
    country: m.country,
    city: m.city,
    expertise: m.expertise,
    availability: m.availability,
    isVisible: true,
    verificationStatus: "approved",
  };

  const existing = await User.findOne({ email: m.email });
  if (existing) {
    existing.name = m.name;
    existing.role = "mentor";
    existing.mentorProfile = mentorProfile;
    await existing.save();
    console.log(`🔁 Updated  ${m.name} — ${m.university}`);
  } else {
    // password is hashed by the model's pre-save hook
    await User.create({ name: m.name, email: m.email, password, role: "mentor", mentorProfile });
    console.log(`✅ Created  ${m.name} — ${m.university}`);
  }
}

const approved = await User.countDocuments({
  role: "mentor",
  "mentorProfile.verificationStatus": "approved",
  "mentorProfile.isVisible": true,
});
console.log(`\n${approved} approved mentors now visible to students.`);
console.log(`Shared dev password for the seeded accounts: ${password}`);

await mongoose.disconnect();
