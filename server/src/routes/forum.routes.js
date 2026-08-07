// ROUTES: community forum + insights.
import { Router } from "express";
import {
  createPost,
  listPosts,
  toggleUpvote,
  ratePost,
  addComment,
} from "../controllers/forum.controller.js";
import { getInsights } from "../controllers/insights.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student", "mentor"));

router.get("/insights", getInsights);   // GET  /api/forum/insights (before /:id routes!)
router.post("/", createPost);           // POST /api/forum
router.get("/", listPosts);             // GET  /api/forum?tag=&city=&sort=
router.post("/:id/upvote", toggleUpvote);
router.post("/:id/rate", ratePost);
router.post("/:id/comments", addComment);

export default router;
