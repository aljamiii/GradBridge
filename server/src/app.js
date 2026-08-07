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
import forumRoutes from "./routes/forum.routes.js";
import toolsRoutes from "./routes/tools.routes.js";
import scholarshipRoutes from "./routes/scholarship.routes.js";
import successPathRoutes from "./routes/successPath.routes.js";
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
app.use("/api/forum", forumRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/success-path", successPathRoutes);

// --- Error handling (must be registered last) ---
app.use(errorHandler);

export default app;
