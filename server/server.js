// Entry point: load environment variables, connect to the database, start the
// HTTP server, and attach Socket.io for real-time chat.
import "dotenv/config";
import http from "node:http";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { initSocket } from "./src/socket.js";

const PORT = process.env.PORT || 5000;

await connectDB();

// Express handles normal requests; Socket.io shares the same HTTP server.
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`✅ GradBridge API + WebSocket running at http://localhost:${PORT}`);
});
