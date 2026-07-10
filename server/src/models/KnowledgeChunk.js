// MODEL: one chunk of the RAG knowledge base.
// Each chunk is a small, focused piece of a destination guide plus its
// embedding vector. At question time we compare the question's vector
// against these to find the most relevant chunks.
import mongoose from "mongoose";

const knowledgeChunkSchema = new mongoose.Schema(
  {
    city: { type: String, required: true },     // e.g., "Toronto"
    country: { type: String, required: true },  // e.g., "Canada"
    topic: { type: String, required: true },    // e.g., "safety", "halal-community"
    text: { type: String, required: true },     // the actual guide content
    embedding: { type: [Number], required: true }, // 768-dim vector
  },
  { timestamps: true }
);

knowledgeChunkSchema.index({ city: 1, topic: 1 });

const KnowledgeChunk = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
export default KnowledgeChunk;
