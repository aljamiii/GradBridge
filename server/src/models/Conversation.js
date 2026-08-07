// MODEL: one chat thread between a student and a mentor.
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: Date.now }, // for sorting the inbox
    lastMessageText: { type: String, default: "" },   // inbox preview
  },
  { timestamps: true }
);

// Exactly ONE conversation per student-mentor pair.
conversationSchema.index({ student: 1, mentor: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
