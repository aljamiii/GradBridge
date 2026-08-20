import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Any request starting with /api is forwarded to the Express server,
    // so the React code can simply call fetch("/api/health").
    proxy: {
      // Port 5000 is taken by macOS AirPlay Receiver, so use 1384 instead.
      // Must match PORT in server/.env
      "/api": "http://localhost:5000",
      // WebSocket proxy for real-time chat (Socket.io)
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
