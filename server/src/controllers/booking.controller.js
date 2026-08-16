// CONTROLLER: session booking (spec: booked slots stored in our own DB,
// with a time-conflict check to prevent double booking).
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendSystemMessage } from "./chat.controller.js";
import { notify } from "../services/notify.js";

const MS_PER_MIN = 60 * 1000;

// POST /api/bookings   body: { mentorId, start, durationMins, topic }  (student)
export const createBooking = async (req, res, next) => {
  try {
    const { mentorId, start, durationMins = 30, topic } = req.body;

    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ success: false, message: "Please pick a valid date and time." });
    }
    if (startDate < new Date()) {
      return res.status(400).json({ success: false, message: "That time is in the past." });
    }

    const mentor = await User.findOne({
      _id: mentorId,
      role: "mentor",
      "mentorProfile.verificationStatus": "approved",
    });
    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found or not approved." });
    }

    // --- TIME-CONFLICT CHECK (spec requirement) ---
    // Overlap rule: existingStart < newEnd AND newStart < existingEnd.
    // Only active bookings (pending/confirmed) block a slot.
    const duration = [30, 60].includes(Number(durationMins)) ? Number(durationMins) : 30;
    const newEnd = new Date(startDate.getTime() + duration * MS_PER_MIN);

    const active = await Booking.find({
      mentor: mentorId,
      status: { $in: ["pending", "confirmed"] },
    });
    const conflict = active.find((b) => {
      const bEnd = new Date(b.start.getTime() + b.durationMins * MS_PER_MIN);
      return b.start < newEnd && startDate < bEnd;
    });
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "That slot is already booked with this mentor — pick a different time.",
      });
    }

    const booking = await Booking.create({
      student: req.user._id,
      mentor: mentorId,
      start: startDate,
      durationMins: duration,
      topic: topic || "",
    });

    // Booking request appears in the chat thread too (in-app notification).
    await sendSystemMessage(
      req.user._id,
      mentor._id,
      `📅 Booking request: ${startDate.toLocaleString()} (${duration} min)${topic ? ` — "${topic}"` : ""}`
    );

    await notify({
      user: mentor._id,
      type: "booking:requested",
      title: `${req.user.name} requested a session`,
      body: `${startDate.toLocaleString()} · ${duration} min${topic ? ` — ${topic}` : ""}`,
      link: "/bookings",
      actor: req.user,
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings  — role-aware: students see theirs, mentors see theirs.
export const listBookings = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "mentor" ? { mentor: req.user._id } : { student: req.user._id };

    const bookings = await Booking.find(filter)
      .sort({ start: 1 })
      .populate("student", "name email")
      .populate("mentor", "name email mentorProfile.university");

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/bookings/:id/rating   body: { stars, comment }
// One rating per session, editable afterwards — same semantics as the forum's
// post ratings, but gated on the session having actually taken place.
export const rateBooking = async (req, res, next) => {
  try {
    const stars = Number(req.body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: "Rating must be 1-5 stars." });
    }

    // Ownership is in the query, not an if-check after the fact.
    const booking = await Booking.findOne({ _id: req.params.id, student: req.user._id });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only a confirmed session can be rated.",
      });
    }
    // `end` is the model's virtual (start + duration) — a session can only be
    // judged once it is over.
    if (booking.end > new Date()) {
      return res.status(400).json({
        success: false,
        message: "You can rate this session once it has finished.",
      });
    }

    booking.rating = {
      stars,
      comment: (req.body.comment ?? "").trim(),
      ratedAt: new Date(),
    };
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// PUT /api/bookings/:id/status   body: { status }
// Mentors: confirm/decline their bookings. Students: cancel their own.
export const setBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowed =
      req.user.role === "mentor" ? ["confirmed", "declined"] : ["cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `As a ${req.user.role} you can only set: ${allowed.join(", ")}.`,
      });
    }

    const filter =
      req.user.role === "mentor"
        ? { _id: req.params.id, mentor: req.user._id }
        : { _id: req.params.id, student: req.user._id };

    const booking = await Booking.findOne(filter);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }
    if (["declined", "cancelled"].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Already ${booking.status}.` });
    }

    booking.status = status;
    // Stamp the mentor's first answer only — a student cancelling later must
    // not overwrite how quickly the mentor replied.
    if (req.user.role === "mentor" && !booking.respondedAt) {
      booking.respondedAt = new Date();
    }
    await booking.save();

    // Notify the other side inside the chat thread.
    const emoji = { confirmed: "✅", declined: "❌", cancelled: "🚫" }[status];
    await sendSystemMessage(
      req.user._id,
      req.user.role === "mentor" ? booking.student : booking.mentor,
      `${emoji} Session on ${booking.start.toLocaleString()} is now ${status}.`
    );

    await notify({
      user: req.user.role === "mentor" ? booking.student : booking.mentor,
      type: `booking:${status}`,
      title: `Session ${status}`,
      body: `${booking.start.toLocaleString()} — ${status} by ${req.user.name}.`,
      link: "/bookings",
      actor: req.user,
    });

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};
