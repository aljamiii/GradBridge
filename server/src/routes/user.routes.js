// ROUTES: user profile endpoints.
import { Router } from "express";
import { updateProfile, getNetworkMap, getNearbyStudents } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.put("/profile", protect, updateProfile); // PUT /api/users/profile
router.get("/network-map", protect, getNetworkMap); // GET /api/users/network-map
router.get("/network-map/nearby", protect, getNearbyStudents); // GET /api/users/network-map/nearby?lat=&lng=

export default router;
