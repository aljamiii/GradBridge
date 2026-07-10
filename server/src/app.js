// The Express app: global middleware + route mounting live here.
// Keeping this separate from server.js makes the app easy to test later.
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// --- Global middleware ---
app.use(cors());            // allow the React dev server to call this API
app.use(express.json());    // parse JSON request bodies into req.body

// --- Routes (each feature gets its own file in src/routes) ---
app.use("/api/health", healthRoutes);
// Phase 2 will add: app.use("/api/auth", authRoutes);

// --- Error handling (must be registered last) ---
app.use(errorHandler);

export default app;
