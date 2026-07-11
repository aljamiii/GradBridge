// ROUTES: student-facing scholarship browsing.
import { Router } from "express";
import { listScholarships } from "../controllers/scholarship.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, authorize("student", "mentor"), listScholarships);

export default router;
