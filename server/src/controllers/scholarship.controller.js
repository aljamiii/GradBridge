// CONTROLLER: scholarships — student browsing + admin review + scrape trigger.
import Scholarship from "../models/Scholarship.js";
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
  try {
    const report = await runScraper();
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
};
