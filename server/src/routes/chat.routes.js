// ROUTES: chat (REST side — live delivery happens over Socket.io).
import { Router } from "express";
import {
  startConversation,
  listConversations,
  getMessages,
  getUnreadCount,
} from "../controllers/chat.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student", "mentor"));

router.post("/start", startConversation);   // POST /api/chat/start
router.get("/", listConversations);         // GET  /api/chat
router.get("/unread-count", getUnreadCount); // GET /api/chat/unread-count
router.get("/:id/messages", getMessages);   // GET  /api/chat/:id/messages

export default router;
