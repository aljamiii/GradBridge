// ROUTES: AI features — student-only.
import { Router } from "express";
import {
  predictCost,
  analyzeEligibility,
  askDestinationAdvisor,
  generateVisaChecklist,
} from "../controllers/ai.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student"));

router.post("/cost-predictor", predictCost);     // POST /api/ai/cost-predictor
router.post("/eligibility", analyzeEligibility); // POST /api/ai/eligibility
router.post("/destination-advisor", askDestinationAdvisor); // POST /api/ai/destination-advisor (RAG)
router.post("/visa-checklist", generateVisaChecklist); // POST /api/ai/visa-checklist

export default router;
