// ROUTES: rule-based decision tools (students only).
import { Router } from "express";
import {
  computeCompatibility,
  analyzeFinancialRisk,
} from "../controllers/tools.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student"));

router.post("/compatibility", computeCompatibility);   // POST /api/tools/compatibility
router.post("/financial-risk", analyzeFinancialRisk);  // POST /api/tools/financial-risk

export default router;
