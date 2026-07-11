// ROUTES: rule-based decision tools (students only).
import { Router } from "express";
import {
  computeCompatibility,
  analyzeFinancialRisk,
  getJobMarket,
  getJobMarketCountries,
  computePRPoints,
} from "../controllers/tools.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student"));

router.post("/compatibility", computeCompatibility);   // POST /api/tools/compatibility
router.post("/financial-risk", analyzeFinancialRisk);  // POST /api/tools/financial-risk
router.get("/job-market/countries", getJobMarketCountries);
router.get("/job-market", getJobMarket);               // GET  /api/tools/job-market
router.post("/pr-points", computePRPoints);            // POST /api/tools/pr-points

export default router;
