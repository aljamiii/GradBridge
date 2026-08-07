// ROUTES: map auth URLs to controller functions.
import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register); // POST /api/auth/register
router.post("/login", login);       // POST /api/auth/login
router.get("/me", protect, getMe);  // GET  /api/auth/me (token required)

export default router;
