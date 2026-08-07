// ROUTES: mentor directory (students only).
import { Router } from "express";
import { listMentors } from "../controllers/mentor.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, authorize("student"), listMentors); // GET /api/mentors

export default router;
