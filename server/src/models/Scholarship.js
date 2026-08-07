import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    provider: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    degreeLevels: {
      type: [String],
      default: [],
    },

    deadline: {
      type: String,
      trim: true,
      default: "",
    },

    fundingType: {
      type: String,
      enum: ["full", "partial", "varies", "unknown"],
      default: "unknown",
    },

    eligibility: {
      type: String,
      trim: true,
      default: "",
    },

    link: {
      type: String,
      trim: true,
      default: "",
    },

    source: {
      type: String,
      required: true,
    },

    scrapedAt: {
      type: Date,
      default: Date.now,
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

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

scholarshipSchema.index({
  status: 1,
  country: 1,
});

const Scholarship = mongoose.model(
  "Scholarship",
  scholarshipSchema
);

export default Scholarship;