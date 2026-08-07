// MODEL: one scraped scholarship/program entry (Module 1 #2).
import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    // --- Structured fields the AI extracts from raw scraped text ---
    title: { type: String, required: true, trim: true },
    provider: { type: String, trim: true }, // university or organization
    country: { type: String, trim: true },
    degreeLevels: [String], // ["Masters", "PhD"]
    deadline: { type: String, trim: true }, // as stated on the page, e.g. "15 October 2026"
    fundingType: {
      type: String,
      enum: ["full", "partial", "varies", "unknown"],
      default: "unknown",
    },
    eligibility: { type: String, trim: true }, // one-paragraph summary
    link: { type: String, trim: true },

    // --- Pipeline metadata ---
    source: { type: String, required: true }, // which site it came from
    scrapedAt: { type: Date, default: Date.now },
    // Normalized fingerprint for duplicate detection (spec: title +
    // university + deadline matching).
    fingerprint: { type: String, required: true, unique: true, index: true },

    // --- AI quality flags (spec: flag entries likely to be outdated) ---
    aiConfidence: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    likelyOutdated: { type: Boolean, default: false },
    flagReason: String, // why the AI flagged it

    // --- Admin review (FR #2) ---
    // Clean entries are auto-approved; flagged ones wait for an admin.
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

scholarshipSchema.index({ status: 1, country: 1 });

const Scholarship = mongoose.model("Scholarship", scholarshipSchema);
export default Scholarship;
