// One-off script: create the Atlas Vector Search index the RAG advisor uses.
// Run once (re-run only if you drop the collection or change dimensions):
//   cd server && node src/scripts/createVectorIndex.js
// Atlas M0 (free tier) supports up to 3 search indexes — this uses one.
import "dotenv/config";
import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const INDEX_NAME = "knowledge_vector_index";
const COLLECTION = "knowledgechunks"; // Mongoose's collection for KnowledgeChunk

await mongoose.connect(process.env.MONGO_URI);
const collection = mongoose.connection.db.collection(COLLECTION);

const docs = await collection.countDocuments();
console.log(`🍃 Connected. ${docs} knowledge chunks in "${COLLECTION}".`);
if (docs === 0) {
  console.log("⚠️  Collection is empty — run seedKnowledge.js first, then re-run this.");
}

try {
  const existing = await collection.listSearchIndexes(INDEX_NAME).toArray();
  if (existing.length > 0) {
    console.log(`✅ Index "${INDEX_NAME}" already exists (status: ${existing[0].status}).`);
    await mongoose.disconnect();
    process.exit(0);
  }

  await collection.createSearchIndex({
    name: INDEX_NAME,
    type: "vectorSearch",
    definition: {
      fields: [
        // Must match what we store: 768-dim gemini-embedding-001 vectors,
        // compared by cosine — the same measure the old in-app loop used.
        { type: "vector", path: "embedding", numDimensions: 768, similarity: "cosine" },
      ],
    },
  });
  console.log(`⏳ Index "${INDEX_NAME}" created — waiting for Atlas to build it...`);

  // Poll until the index is queryable (usually well under a minute for a
  // collection this small).
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const [idx] = await collection.listSearchIndexes(INDEX_NAME).toArray();
    console.log(`   status: ${idx?.status ?? "unknown"}`);
    if (idx?.queryable) {
      console.log("✅ Vector index is live — the advisor now retrieves via $vectorSearch.");
      break;
    }
  }
} catch (err) {
  console.error(`❌ Could not create the search index: ${err.message}`);
  console.error("   (Search indexes need MongoDB Atlas — local MongoDB doesn't support them.");
  console.error("    The advisor still works: it falls back to the in-memory cosine scan.)");
}

await mongoose.disconnect();
process.exit(0);
