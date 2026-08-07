import mongoose from "mongoose";

const candidateDataSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    degreeLevels: {
      type: [String],
      default: [],
    },

    deadline: {
      type: String,
      default: "",
    },

    fundingType: {
      type: String,
      enum: ["full", "partial", "varies", "unknown"],
      default: "unknown",
    },

    eligibility: {
      type: String,
      default: "",
    },

    link: {
      type: String,
      default: "",
    },

    source: {
      type: String,
      default: "",
    },

    aiConfidence: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    likelyOutdated: {
      type: Boolean,
      default: false,
    },

    flagReason: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const duplicateCandidateSchema = new mongoose.Schema(
  {
    // The scholarship already stored in the database
    originalScholarship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },

    // The newly scraped record that looks similar
    candidateData: {
      type: candidateDataSchema,
      required: true,
    },

    // Example: 0.82 = 82% similar
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    matchType: {
      type: String,
      enum: ["exact", "fuzzy"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "merged",
        "keep_both",
        "deleted",
      ],
      default: "pending",
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DuplicateCandidate = mongoose.model(
  "DuplicateCandidate",
  duplicateCandidateSchema
);

export default DuplicateCandidate;