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
      "/api": "http://localhost:1384",
      // WebSocket proxy for real-time chat (Socket.io)
      "/socket.io": {
        target: "http://localhost:1384",
        ws: true,
      },
    },
  },
});
