import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The team default is 5000, but macOS reserves that port for the AirPlay
  // Receiver (Control Center), which answers every request with an empty 403.
  // Put API_PORT=<your port> in client/.env.local (git-ignored) to override
  // without touching this file — it must match PORT in server/.env.
  const env = loadEnv(mode, process.cwd(), "");
  const target = `http://localhost:${env.API_PORT || 5000}`;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // Any request starting with /api is forwarded to the Express server,
      // so the React code can simply call fetch("/api/health").
      proxy: {
        "/api": target,
        // WebSocket proxy for real-time chat (Socket.io)
        "/socket.io": {
          target,
          ws: true,
        },
      },
    },
  };
});
