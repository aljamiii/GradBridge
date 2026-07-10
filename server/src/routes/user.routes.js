// ROUTES: user profile endpoints.
import { Router } from "express";
import { updateProfile } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/profile", protect, updateProfile); // PUT /api/users/profile

export default router;
