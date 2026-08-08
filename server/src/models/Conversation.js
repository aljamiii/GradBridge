// MODEL: one chat thread between any TWO users.
// Originally student↔mentor only; generalized to peer-to-peer so the
// Network Map's "Say hi" can open student↔student threads too.
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: [(v) => v.length === 2, "A conversation has exactly two participants"],
    },
    // Sorted "idA:idB". A multikey index on the array can't say "this exact
    // unordered PAIR is unique" — this derived key can, with a unique index.
    pairKey: { type: String, required: true, unique: true },
    lastMessageAt: { type: Date, default: Date.now }, // for sorting the inbox
    lastMessageText: { type: String, default: "" },   // inbox preview
  },
  { timestamps: true }
);

// "Whose inbox is this in?" — one multikey index serves both participants.
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// The canonical key for a pair of user ids, in either order.
conversationSchema.statics.pairKeyFor = (a, b) =>
  [String(a), String(b)].sort().join(":");

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
