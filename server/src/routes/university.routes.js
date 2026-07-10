// ROUTES: university search (any logged-in user can explore).
import { Router } from "express";
import { searchUniversities } from "../controllers/university.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/search", protect, searchUniversities); // GET /api/universities/search

export default router;
