// ROUTES: admin panel. Every route here requires an admin token.
import { Router } from "express";
import { listMentors, setMentorStatus } from "../controllers/admin.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Applied to ALL routes in this file:
router.use(protect, authorize("admin"));

router.get("/mentors", listMentors);              // GET /api/admin/mentors?status=pending
router.put("/mentors/:id/status", setMentorStatus); // PUT /api/admin/mentors/:id/status

export default router;
