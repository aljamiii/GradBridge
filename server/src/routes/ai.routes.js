// ROUTES: AI features — student-only.
import { Router } from "express";
import { predictCost } from "../controllers/ai.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student"));

router.post("/cost-predictor", predictCost); // POST /api/ai/cost-predictor

export default router;
