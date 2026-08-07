// One-off script: embed the knowledge base and store it in MongoDB.
// Re-run any time you edit src/data/knowledgeBase.js:
//   cd server && node src/scripts/seedKnowledge.js
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";
import KnowledgeChunk from "../models/KnowledgeChunk.js";
import knowledgeBase from "../data/knowledgeBase.js";
import { embedText } from "../services/gemini.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

await mongoose.connect(process.env.MONGO_URI);
console.log(`🍃 Connected. Seeding ${knowledgeBase.length} knowledge chunks...`);

// Wipe and re-seed so edits to the knowledge base are always reflected.
await KnowledgeChunk.deleteMany({});

let done = 0;
for (const entry of knowledgeBase) {
  const embedding = await embedText(`${entry.city}, ${entry.country} — ${entry.topic}: ${entry.text}`);
  await KnowledgeChunk.create({ ...entry, embedding });
  done += 1;
  console.log(`  ✔ [${done}/${knowledgeBase.length}] ${entry.city} / ${entry.topic}`);
}

console.log("✅ Knowledge base seeded.");
await mongoose.disconnect();
process.exit(0);
