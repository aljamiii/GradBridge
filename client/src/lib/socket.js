// One shared Socket.io connection for the whole app.
// Connects lazily (first use) with the login token; reconnects on demand.
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("gradbridge_token");
  if (!token) return null;

  if (!socket) {
    socket = io("/", {
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
