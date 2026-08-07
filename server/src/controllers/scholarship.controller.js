// CONTROLLER: scholarships — student browsing + admin review + scrape trigger.
import Scholarship from "../models/Scholarship.js";
import ScrapeRun from "../models/ScrapeRun.js";
import { runScraper } from "../services/scraper.js";

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
