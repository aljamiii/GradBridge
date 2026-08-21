import mongoose from "mongoose";

const sourceResultSchema = new mongoose.Schema(
  {
    source: String,
    found: {
      type: Number,
      default: 0,
    },
    added: {
      type: Number,
      default: 0,
    },
    duplicates: {
      type: Number,
      default: 0,
    },
    flagged: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const scrapeRunSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },

    trigger: {
      type: String,
      enum: ["manual", "scheduled"],
      default: "manual",
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    totalFound: {
      type: Number,
      default: 0,
    },

    totalAdded: {
      type: Number,
      default: 0,
    },

    totalDuplicates: {
      type: Number,
      default: 0,
    },

    totalFlagged: {
      type: Number,
      default: 0,
    },

    results: [sourceResultSchema],

    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const ScrapeRun = mongoose.model("ScrapeRun", scrapeRunSchema);

export default ScrapeRun;