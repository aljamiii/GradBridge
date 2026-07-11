// CONTROLLER: chat — REST endpoints for history/inbox, plus shared helpers
// used by Socket.io (live sending) and bookings (system notifications).
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getIO } from "../socket.js";

// Find or create the single conversation between a student and a mentor.
// Accepts the two user ids in either order + roles are validated.
export const getOrCreateConversation = async (userA, userB) => {
  const [a, b] = await Promise.all([User.findById(userA), User.findById(userB)]);
  if (!a || !b) throw Object.assign(new Error("User not found."), { statusCode: 404 });

  const student = a.role === "student" ? a : b;
  const mentor = a.role === "mentor" ? a : b;
  if (student.role !== "student" || mentor.role !== "mentor") {
    throw Object.assign(new Error("Chat is between a student and a mentor."), { statusCode: 400 });
  }

  let convo = await Conversation.findOne({ student: student._id, mentor: mentor._id });
  convo ??= await Conversation.create({ student: student._id, mentor: mentor._id });
  return convo;
};

// Save a message + update the inbox preview + push it live over sockets.
export const deliverMessage = async ({ conversation, sender, text, isSystem = false }) => {
  const recipient =
    String(conversation.student) === String(sender)
      ? conversation.mentor
      : conversation.student;

  const message = await Message.create({
    conversation: conversation._id,
    sender: isSystem ? null : sender,
    text,
    isSystem,
    unreadFor: recipient,
  });

  conversation.lastMessageAt = new Date();
  conversation.lastMessageText = isSystem ? text : text.slice(0, 80);
  await conversation.save();

  // Live delivery: everyone viewing this thread + the recipient's personal
  // room (for the navbar unread badge, even if they're on another page).
  const io = getIO();
  if (io) {
    io.to(`convo:${conversation._id}`).emit("message:new", message);
    io.to(`user:${recipient}`).emit("inbox:update");
  }
  return message;
};

// Used by the booking controller: "📅 Booking request…", "✅ confirmed…"
export const sendSystemMessage = async (fromUserId, toUserId, text) => {
  const convo = await getOrCreateConversation(fromUserId, toUserId);
  return deliverMessage({ conversation: convo, sender: fromUserId, text, isSystem: true });
};

// ---------- REST endpoints ----------

// POST /api/chat/start   body: { userId }  → open (or find) a conversation
export const startConversation = async (req, res, next) => {
  try {
    const convo = await getOrCreateConversation(req.user._id, req.body.userId);
    res.json({ success: true, conversationId: convo._id });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat  → my inbox with unread counts
export const listConversations = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "mentor" ? { mentor: req.user._id } : { student: req.user._id };

    const convos = await Conversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .populate("student", "name")
      .populate("mentor", "name mentorProfile.university");

    const withUnread = await Promise.all(
      convos.map(async (c) => ({
        id: c._id,
        student: c.student,
        mentor: c.mentor,
        lastMessageAt: c.lastMessageAt,
        lastMessageText: c.lastMessageText,
        unread: await Message.countDocuments({ conversation: c._id, unreadFor: req.user._id }),
      }))
    );

    res.json({ success: true, conversations: withUnread });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/:id/messages  → history (also marks them read)
export const getMessages = async (req, res, next) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    const mine =
      convo &&
      [String(convo.student), String(convo.mentor)].includes(String(req.user._id));
    if (!mine) {
      return res.status(404).json({ success: false, message: "Conversation not found." });
    }

    const messages = await Message.find({ conversation: convo._id })
      .sort({ createdAt: 1 })
      .limit(200);

    // Opening the thread = reading it.
    await Message.updateMany(
      { conversation: convo._id, unreadFor: req.user._id },
      { unreadFor: null }
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/unread-count  → total unread (navbar badge)
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ unreadFor: req.user._id });
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};
