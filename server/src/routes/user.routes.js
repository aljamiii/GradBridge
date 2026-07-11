// ROUTES: user profile endpoints.
import { Router } from "express";
import { updateProfile, getNetworkMap } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/profile", protect, updateProfile); // PUT /api/users/profile
router.get("/network-map", protect, getNetworkMap); // GET /api/users/network-map

export default router;
