// MODEL: one chat message inside a conversation.
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    // sender is null for system messages (booking notifications).
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    isSystem: { type: Boolean, default: false },
    // Which user still needs to read this (simple two-person model).
    unreadFor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
