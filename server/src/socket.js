// Socket.io setup: real-time chat with JWT authentication.
// REST handles history and inbox; sockets handle LIVE delivery.
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Conversation from "./models/Conversation.js";

let io = null;
export const getIO = () => io;

// Presence: who has at least one live socket right now.
// userId → open connection count (one user can have several tabs).
const online = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: true }, // dev-friendly; tighten to the real domain on deploy
  });

  // Handshake auth: the client sends its JWT; no valid token → no socket.
  io.use((socket, next) => {
    try {
      const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    // Personal room: lets the server ping this user anywhere in the app
    // (unread badges, booking alerts).
    socket.join(`user:${socket.userId}`);

    // --- Presence (Network Map "online now" dots) ---
    // First connection for this user → tell everyone they came online.
    const count = online.get(socket.userId) ?? 0;
    online.set(socket.userId, count + 1);
    if (count === 0) {
      io.emit("presence:update", { userId: socket.userId, online: true });
    }

    // Late joiners (e.g. opening the map mid-session) ask for the full list.
    socket.on("presence:get", (ack) => ack?.([...online.keys()]));

    socket.on("disconnect", () => {
      const left = (online.get(socket.userId) ?? 1) - 1;
      if (left <= 0) {
        online.delete(socket.userId);
        io.emit("presence:update", { userId: socket.userId, online: false });
      } else {
        online.set(socket.userId, left);
      }
    });

    // Join a conversation room — only if the user actually belongs to it.
    socket.on("convo:join", async (conversationId) => {
      const convo = await Conversation.findById(conversationId).catch(() => null);
      const mine =
        convo &&
        [String(convo.student), String(convo.mentor)].includes(String(socket.userId));
      if (mine) socket.join(`convo:${conversationId}`);
    });

    socket.on("convo:leave", (conversationId) => {
      socket.leave(`convo:${conversationId}`);
    });

    // Live message: save via the shared helper, which also emits to rooms.
    socket.on("message:send", async ({ conversationId, text }, ack) => {
      try {
        const clean = (text || "").trim();
        if (!clean) return ack?.({ error: "Empty message." });

        const convo = await Conversation.findById(conversationId);
        const mine =
          convo &&
          [String(convo.student), String(convo.mentor)].includes(String(socket.userId));
        if (!mine) return ack?.({ error: "Not your conversation." });

        // Lazy import avoids a circular dependency at module load time.
        const { deliverMessage } = await import("./controllers/chat.controller.js");
        const message = await deliverMessage({
          conversation: convo,
          sender: socket.userId,
          text: clean,
        });
        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ error: err.message });
      }
    });
  });

  return io;
};
