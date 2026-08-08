// CONTROLLER: chat — REST endpoints for history/inbox, plus shared helpers
// used by Socket.io (live sending) and bookings (system notifications).
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getIO } from "../socket.js";

// Find or create the single conversation between any two users (peer-to-peer:
// student↔mentor for bookings, student↔student via the map's "Say hi").
// Accepts the two user ids in either order.
export const getOrCreateConversation = async (userA, userB) => {
  if (String(userA) === String(userB)) {
    throw Object.assign(new Error("You can't chat with yourself."), { statusCode: 400 });
  }
  const [a, b] = await Promise.all([User.findById(userA), User.findById(userB)]);
  if (!a || !b) throw Object.assign(new Error("User not found."), { statusCode: 404 });

  // Atomic find-or-create: upsert on the unique pairKey, so two simultaneous
  // "Say hi" clicks can never create two threads for the same pair.
  const pairKey = Conversation.pairKeyFor(a._id, b._id);
  return Conversation.findOneAndUpdate(
    { pairKey },
    { $setOnInsert: { participants: [a._id, b._id], pairKey } },
    { new: true, upsert: true }
  );
};

// Save a message + update the inbox preview + push it live over sockets.
export const deliverMessage = async ({ conversation, sender, text, isSystem = false }) => {
  const recipient = conversation.participants.find(
    (p) => String(p) !== String(sender)
  );

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
    const convos = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name role mentorProfile.university");

    const withUnread = await Promise.all(
      convos.map(async (c) => {
        // The inbox shows "who am I talking to", not student/mentor slots.
        const other = c.participants.find(
          (p) => String(p._id) !== String(req.user._id)
        );
        return {
          id: c._id,
          other: other
            ? {
                id: other._id,
                name: other.name,
                role: other.role,
                university: other.mentorProfile?.university ?? null,
              }
            : null,
          lastMessageAt: c.lastMessageAt,
          lastMessageText: c.lastMessageText,
          unread: await Message.countDocuments({ conversation: c._id, unreadFor: req.user._id }),
        };
      })
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
      convo && convo.participants.map(String).includes(String(req.user._id));
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
