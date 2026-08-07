// CONTROLLER (the C in MVC): auth logic — register, login, current user.
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Create a signed token that proves "this is user X" on future requests.
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Shape the user object we send back (never include the password hash).
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  studentProfile: user.studentProfile,
  mentorProfile: user.mentorProfile,
});

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Nobody can self-register as admin — admins are created manually.
    const safeRole = ["student", "mentor"].includes(role) ? role : "student";

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "An account with this email already exists." });
    }

    // Password is hashed automatically by the pre-save hook in the model.
    const user = await User.create({ name, email, phone, password, role: safeRole });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    // Mongoose validation errors → friendly 400 instead of a 500 crash.
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstMessage });
    }
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password." });
    }

    // password has select:false in the model, so opt back in with +password.
    const user = await User.findOne({ email }).select("+password");

    // Same message for "no such user" and "wrong password" —
    // never tell an attacker which one was wrong.
    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (requires a valid token — see auth middleware)
export const getMe = async (req, res) => {
  // req.user was attached by the protect middleware.
  res.json({ success: true, user: publicUser(req.user) });
};
