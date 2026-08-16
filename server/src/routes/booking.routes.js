// ROUTES: session bookings.
import { Router } from "express";
import {
  createBooking,
  listBookings,
  setBookingStatus,
  rateBooking,
} from "../controllers/booking.controller.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.post("/", authorize("student"), createBooking); // students book
router.get("/", authorize("student", "mentor"), listBookings);
router.put("/:id/status", authorize("student", "mentor"), setBookingStatus);
router.put("/:id/rating", authorize("student"), rateBooking); // only students rate

export default router;
