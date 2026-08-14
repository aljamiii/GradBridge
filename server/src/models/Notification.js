// MODEL: one thing that happened which a user should know about.
//
// Persisted (not just a socket push) so notifications survive a reload and a
// user who was offline still sees what they missed.
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: {
      type: String,
      required: true,
      enum: [
        "connection:request",
        "connection:accepted",
        "booking:requested",
        "booking:confirmed",
        "booking:declined",
        "booking:cancelled",
        "forum:reply",
      ],
    },

    title: { type: String, required: true },  // "Nusrat Jahan accepted your request"
    body: { type: String, default: "" },      // optional second line
    link: { type: String, default: "" },      // where clicking should go

    // Who caused it — used for the avatar. Denormalised name so the list
    // renders without a populate on every row.
    actorName: { type: String, default: "" },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// The only query we run: "my notifications, newest first".
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
