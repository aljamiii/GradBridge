// ROUTES: session bookings.
import { Router } from "express";
import {
  createBooking,
  listBookings,
  setBookingStatus,
} from "../controllers/booking.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.post("/", authorize("student"), createBooking); // students book
router.get("/", authorize("student", "mentor"), listBookings);
router.put("/:id/status", authorize("student", "mentor"), setBookingStatus);

export default router;
