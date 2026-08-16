// MODEL: a mentoring session booked by a student with a mentor.
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    start: { type: Date, required: [true, "Session start time is required"] },
    durationMins: { type: Number, enum: [30, 60], default: 30 },
    topic: { type: String, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "declined", "cancelled"],
      default: "pending", // mentor confirms or declines; student may cancel
    },
    // When the MENTOR first answered (confirmed or declined). Recorded
    // separately because `updatedAt` moves on any later edit — a session that
    // was confirmed quickly then cancelled weeks later would otherwise look
    // like a weeks-long response time.
    respondedAt: Date,
  },
  { timestamps: true }
);

// Virtual end time, handy for conflict checks and display.
bookingSchema.virtual("end").get(function () {
  return new Date(this.start.getTime() + this.durationMins * 60 * 1000);
});

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
