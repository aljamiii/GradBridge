// MODEL: a university a student saved to their profile (full CRUD feature).
import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    // Who saved it — every query is scoped by this so users only see their own.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Snapshot of the university details at save time:
    name: { type: String, required: [true, "University name is required"] },
    country: String,
    stateProvince: String,
    website: String,
    domain: String,
    // The student's own notes — the U in CRUD (editable after saving).
    notes: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

// One user cannot save the same university twice.
favoriteSchema.index({ user: 1, name: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
