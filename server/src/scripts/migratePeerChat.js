// One-off: migrate legacy student/mentor conversations to the peer-to-peer
// shape (participants[2] + unique pairKey), then sync indexes so the old
// unique (student, mentor) index is dropped — left in place it would reject
// every new conversation as a duplicate (null, null) pair.
//   cd server && node src/scripts/migratePeerChat.js
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import Conversation from "../models/Conversation.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

await mongoose.connect(process.env.MONGO_URI);

// Raw collection access: the schema no longer knows student/mentor.
const coll = Conversation.collection;
const legacy = await coll.find({ student: { $exists: true } }).toArray();

for (const c of legacy) {
  const pairKey = Conversation.pairKeyFor(c.student, c.mentor);
  await coll.updateOne(
    { _id: c._id },
    {
      $set: { participants: [c.student, c.mentor], pairKey },
      $unset: { student: "", mentor: "" },
    }
  );
  console.log(`  ✔ ${c._id} → ${pairKey}`);
}

// Drops indexes the schema no longer declares (student_1_mentor_1) and
// builds the new ones (pairKey unique, participants+lastMessageAt).
await Conversation.syncIndexes();

console.log(`✅ Migrated ${legacy.length} conversation(s); indexes synced.`);
await mongoose.disconnect();
process.exit(0);
