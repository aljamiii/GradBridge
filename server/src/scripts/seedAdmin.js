// One-off script: create (or reset) the admin account.
// Usage, from the server/ folder:
//   node src/scripts/seedAdmin.js <email> <password> [name]
// Example:
//   node src/scripts/seedAdmin.js admin@gradbridge.dev admin12345 "Platform Admin"
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import User from "../models/User.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]); // same DNS fix as config/db.js

const [email, password, name = "Platform Admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node src/scripts/seedAdmin.js <email> <password> [name]");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

const existing = await User.findOne({ email });
if (existing) {
  // Account exists → promote it to admin and reset the password.
  existing.role = "admin";
  existing.password = password; // re-hashed by the pre-save hook
  existing.name = name;
  await existing.save();
  console.log(`🔁 Existing account ${email} promoted to admin (password reset).`);
} else {
  await User.create({ name, email, password, role: "admin" });
  console.log(`✅ Admin account created: ${email}`);
}

await mongoose.disconnect();
