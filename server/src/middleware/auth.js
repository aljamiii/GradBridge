// Auth middleware: runs BEFORE protected controllers.
// protect  → "you must be logged in" (valid JWT required)
// authorize → "you must have one of these roles"
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // Expect header:  Authorization: Bearer <token>
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Not logged in. Please log in first." });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "This account no longer exists." });
    }

    req.user = user; // controllers downstream can now use req.user
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Session invalid or expired. Please log in again." });
  }
};

// Usage: router.get("/admin-only", protect, authorize("admin"), handler)
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Only ${roles.join("/")} accounts can do this.`,
      });
    }
    next();
  };
