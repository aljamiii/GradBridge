// One shared Socket.io connection for the whole app.
// Connects lazily (first use) with the login token; reconnects on demand.
import { io } from "socket.io-client";

// Same rule as lib/api.js: relative in development (the vite proxy tunnels
// /socket.io), absolute in production because the API lives on another domain.
// "/" keeps Socket.io pointed at the current origin when no base is set.
const API_BASE = import.meta.env.VITE_API_URL || "/";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("gradbridge_token");
  if (!token) return null;

  if (!socket) {
    socket = io(API_BASE, {
      auth: { token },
      autoConnect: true,
    });
  }
  return socket;
}

// Call on logout so the next login builds a fresh authenticated connection.
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
