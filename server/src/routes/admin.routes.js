// ROUTES: admin panel. Every route here requires an admin token.
import { Router } from "express";
import { listMentors, setMentorStatus } from "../controllers/admin.controller.js";
import {
  adminListScholarships,
  setScholarshipStatus,
  triggerScrape,
  getAggregatorDashboard,
  updateScholarship,
  getDuplicateCandidates,
  mergeDuplicates,
  keepBothDuplicates,
  deleteDuplicate,
} from "../controllers/scholarship.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Applied to ALL routes in this file:
router.use(protect, authorize("admin"));

router.get("/mentors", listMentors);              // GET /api/admin/mentors?status=pending
router.put("/mentors/:id/status", setMentorStatus); // PUT /api/admin/mentors/:id/status
router.get(
  "/scholarships/dashboard",
  getAggregatorDashboard
);  
router.get("/scholarships", adminListScholarships);  
        // review queue
router.put(
  "/scholarships/:id",
  updateScholarship
);
router.put("/scholarships/:id/status", setScholarshipStatus); // approve/reject
router.get(
  "/scholarships/duplicates",
  getDuplicateCandidates
);

router.put(
  "/scholarships/duplicates/:id/merge",
  mergeDuplicates
);

router.put(
  "/scholarships/duplicates/:id/keep-both",
  keepBothDuplicates
);

router.delete(
  "/scholarships/duplicates/:id",
  deleteDuplicate
);
router.post("/scholarships/scrape", triggerScrape); 
       // run pipeline now

export default router;
