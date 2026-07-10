// ROUTES: map URLs to controller functions. No logic here — just wiring.
import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";

const router = Router();

router.get("/", getHealth); // GET /api/health

export default router;
