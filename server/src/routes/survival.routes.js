// ROUTES: survival guide.
import { Router } from "express";
import { getSurvivalGuide } from "../controllers/survival.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, authorize("student"), getSurvivalGuide); // GET /api/survival-guide

export default router;
