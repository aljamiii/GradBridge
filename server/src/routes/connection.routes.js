// ROUTES: the Connect network. Open to students and mentors alike —
// connections are person-to-person, not role-to-role.
import { Router } from "express";
import {
  sendRequest,
  acceptRequest,
  removeConnection,
  listConnections,
  listPending,
  getStatuses,
} from "../controllers/connection.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

// Specific paths first — "/pending" must not be read as an :id.
router.get("/pending", listPending);      // GET    /api/connections/pending
router.get("/status", getStatuses);       // GET    /api/connections/status?userIds=
router.get("/", listConnections);         // GET    /api/connections?q=
router.post("/", sendRequest);            // POST   /api/connections
router.put("/:id/accept", acceptRequest); // PUT    /api/connections/:id/accept
router.delete("/:id", removeConnection);  // DELETE /api/connections/:id

export default router;
