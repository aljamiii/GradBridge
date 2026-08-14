// ROUTES: notification centre (any logged-in user).
import { Router } from "express";
import {
  listNotifications,
  markRead,
  clearRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listNotifications);   // GET    /api/notifications
router.put("/read", markRead);        // PUT    /api/notifications/read  { id? }
router.delete("/", clearRead);        // DELETE /api/notifications

export default router;
