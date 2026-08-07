// ROUTES: success path explorer.
import { Router } from "express";
import { getSuccessPath } from "../controllers/successPath.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, authorize("student", "mentor"), getSuccessPath);

export default router;
