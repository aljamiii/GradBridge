// The Express app: global middleware + route mounting live here.
// Keeping this separate from server.js makes the app easy to test later.
import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import universityRoutes from "./routes/university.routes.js";
import favoriteRoutes from "./routes/favorite.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import mentorRoutes from "./routes/mentor.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import survivalRoutes from "./routes/survival.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// --- Global middleware ---
app.use(cors());            // allow the React dev server to call this API
app.use(express.json());    // parse JSON request bodies into req.body

// --- Routes (each feature gets its own file in src/routes) ---
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/survival-guide", survivalRoutes);

// --- Error handling (must be registered last) ---
app.use(errorHandler);

export default app;
