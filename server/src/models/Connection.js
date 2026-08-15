// MODEL: a connection between two users ("Connect" on a profile card).
//
// Design decision: this is a REQUEST → ACCEPT flow, not an instant follow.
// Anyone can already message anyone (peer chat), so the value of a connection
// is that it's mutual — a curated list of people who agreed to stay in touch.
// It also stops one person spamming themselves onto a hundred lists.
import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    // Who pressed Connect first. Kept so we can show "wants to connect with you"
    // vs "request sent" without a second lookup.
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },

    // Sorted "idA:idB" — same trick as Conversation. A multikey index can't
    // enforce "this unordered PAIR appears once", but a derived key can.
    pairKey: { type: String, required: true, unique: true },

    acceptedAt: Date,
  },
  { timestamps: true }
);

// "Show me everything involving this user, newest first."
connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });

connectionSchema.statics.pairKeyFor = (a, b) => [String(a), String(b)].sort().join(":");

const Connection = mongoose.model("Connection", connectionSchema);
export default Connection;
