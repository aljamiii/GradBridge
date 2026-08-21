// CONTROLLER: scholarships — student browsing + admin review + scrape trigger.
import Scholarship from "../models/Scholarship.js";
import ScrapeRun from "../models/ScrapeRun.js";
import { runScraper } from "../services/scraper.js";
import DuplicateCandidate from "../models/DuplicateCandidate.js";

// GET /api/scholarships?country=&fundingType=&q=   (students see APPROVED only)
export const listScholarships = async (req, res, next) => {
  try {
    const { country, fundingType, q } = req.query;

    const filter = { status: "approved" };
    if (country) filter.country = new RegExp(String(country).trim(), "i");
    if (fundingType && fundingType !== "all") filter.fundingType = fundingType;
    if (q) filter.title = new RegExp(String(q).trim(), "i");

    const scholarships = await Scholarship.find(filter)
      .sort({ scrapedAt: -1 })
      .limit(60);

    res.json({ success: true, count: scholarships.length, scholarships });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin (FR #2: monitor scraped data quality) ----------

// GET /api/admin/scholarships/duplicates?status=pending
export const getDuplicateCandidates = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;

    const filter =
      status === "all"
        ? {}
        : { status };

    const duplicates = await DuplicateCandidate.find(filter)
      .populate("originalScholarship")
      .sort({ detectedAt: -1 });

    res.json({
      success: true,
      count: duplicates.length,
      duplicates,
    });
  } catch (err) {
    next(err);
  }
};


// PUT /api/admin/scholarships/duplicates/:id/merge
export const mergeDuplicates = async (req, res, next) => {
  try {
    const candidate = await DuplicateCandidate.findById(
      req.params.id
    ).populate("originalScholarship");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Duplicate candidate not found.",
      });
    }

    if (candidate.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This duplicate has already been resolved.",
      });
    }

    const original = candidate.originalScholarship;
    const incoming = candidate.candidateData;

    if (!original) {
      return res.status(404).json({
        success: false,
        message: "Original scholarship no longer exists.",
      });
    }

    // Fill missing information from the newly scraped record.
    if (!original.provider && incoming.provider) {
      original.provider = incoming.provider;
    }

    if (!original.country && incoming.country) {
      original.country = incoming.country;
    }

    if (
      (!original.degreeLevels ||
        original.degreeLevels.length === 0) &&
      incoming.degreeLevels?.length
    ) {
      original.degreeLevels = incoming.degreeLevels;
    }

    if (!original.deadline && incoming.deadline) {
      original.deadline = incoming.deadline;
    }

    if (
      (!original.fundingType ||
        original.fundingType === "unknown") &&
      incoming.fundingType
    ) {
      original.fundingType = incoming.fundingType;
    }

    if (!original.eligibility && incoming.eligibility) {
      original.eligibility = incoming.eligibility;
    }

    if (!original.link && incoming.link) {
      original.link = incoming.link;
    }

    // Improve AI confidence when the new record has better confidence.
    const confidenceRank = {
      low: 1,
      medium: 2,
      high: 3,
    };

    if (
      confidenceRank[incoming.aiConfidence] >
      confidenceRank[original.aiConfidence]
    ) {
      original.aiConfidence = incoming.aiConfidence;
    }

    original.scrapedAt = new Date();

    await original.save();

    candidate.status = "merged";
    candidate.resolvedAt = new Date();

    await candidate.save();

    res.json({
      success: true,
      message: "Duplicate records merged successfully.",
      scholarship: original,
      candidate,
    });
  } catch (err) {
    next(err);
  }
};


// PUT /api/admin/scholarships/duplicates/:id/keep-both
export const keepBothDuplicates = async (req, res, next) => {
  try {
    const candidate = await DuplicateCandidate.findById(
      req.params.id
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Duplicate candidate not found.",
      });
    }

    if (candidate.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This duplicate has already been resolved.",
      });
    }

    const incoming = candidate.candidateData;

    const createdScholarship = await Scholarship.create({
      title: incoming.title,
      provider: incoming.provider || "",
      country: incoming.country || "",
      degreeLevels: incoming.degreeLevels || [],
      deadline: incoming.deadline || "",
      fundingType: incoming.fundingType || "unknown",
      eligibility: incoming.eligibility || "",
      link: incoming.link || "",
      source: incoming.source || "Admin Duplicate Review",

      aiConfidence: incoming.aiConfidence || "medium",
      likelyOutdated: Boolean(incoming.likelyOutdated),
      flagReason: incoming.flagReason || "",

      status: "approved",
      scrapedAt: new Date(),
    });

    candidate.status = "keep_both";
    candidate.resolvedAt = new Date();

    await candidate.save();

    res.json({
      success: true,
      message: "Both scholarship records were kept.",
      scholarship: createdScholarship,
      candidate,
    });
  } catch (err) {
    next(err);
  }
};


// DELETE /api/admin/scholarships/duplicates/:id
export const deleteDuplicate = async (req, res, next) => {
  try {
    const candidate = await DuplicateCandidate.findById(
      req.params.id
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Duplicate candidate not found.",
      });
    }

    if (candidate.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This duplicate has already been resolved.",
      });
    }

    candidate.status = "deleted";
    candidate.resolvedAt = new Date();

    await candidate.save();

    res.json({
      success: true,
      message: "Duplicate candidate deleted.",
      candidate,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/scholarships?status=pending|approved|rejected|all
export const adminListScholarships = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const filter = status === "all" ? {} : { status };

    const scholarships = await Scholarship.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: scholarships.length, scholarships });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/scholarships/:id/status   body: { status: approved|rejected }
export const setScholarshipStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!scholarship) {
      return res.status(404).json({ success: false, message: "Entry not found." });
    }

    res.json({ success: true, scholarship });
  } catch (err) {
    next(err);
  }
};

export const updateScholarship = async (req, res, next) => {
  try {
    const allowedFields = [
      "title",
      "provider",
      "country",
      "deadline",
      "fundingType",
      "eligibility",
      "link",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const scholarship = await Scholarship.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: "Scholarship not found.",
      });
    }

    res.json({
      success: true,
      scholarship,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/scholarships/scrape — run the pipeline right now.
export const triggerScrape = async (req, res, next) => {
  let scrapeRun;

  try {
    scrapeRun = await ScrapeRun.create({
      status: "running",
      trigger: "manual",
      startedAt: new Date(),
    });

    const report = await runScraper();

    const totalFound = report.reduce(
      (sum, item) => sum + item.found,
      0
    );

    const totalAdded = report.reduce(
      (sum, item) => sum + item.added,
      0
    );

    const totalDuplicates = report.reduce(
      (sum, item) => sum + item.duplicates,
      0
    );

    const totalFlagged = report.reduce(
      (sum, item) => sum + item.flagged,
      0
    );

    scrapeRun.status = "completed";
    scrapeRun.completedAt = new Date();
    scrapeRun.results = report;
    scrapeRun.totalFound = totalFound;
    scrapeRun.totalAdded = totalAdded;
    scrapeRun.totalDuplicates = totalDuplicates;
    scrapeRun.totalFlagged = totalFlagged;

    await scrapeRun.save();

    res.json({
      success: true,
      report,
      scrapeRun,
    });
  } catch (err) {
    if (scrapeRun) {
      scrapeRun.status = "failed";
      scrapeRun.completedAt = new Date();
      scrapeRun.errorMessage = err.message;

      await scrapeRun.save();
    }

    next(err);
  }
};

export const getAggregatorDashboard = async (req, res, next) => {
  try {
    const totalPrograms = await Scholarship.countDocuments();

    const approved = await Scholarship.countDocuments({
      status: "approved",
    });

    const pending = await Scholarship.countDocuments({
      status: "pending",
    });

    const rejected = await Scholarship.countDocuments({
      status: "rejected",
    });

    const outdated = await Scholarship.countDocuments({
      likelyOutdated: true,
    });

    const lowConfidence = await Scholarship.countDocuments({
      aiConfidence: "low",
    });

    const recentScholarships = await Scholarship.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const latestRun = await ScrapeRun.findOne()
      .sort({ startedAt: -1 });

    res.json({
      success: true,

      stats: {
        totalPrograms,
        approved,
        pending,
        rejected,
        outdated,
        lowConfidence,
      },

      latestRun,

      recentScholarships,
    });
  } catch (err) {
    next(err);
  }
};
