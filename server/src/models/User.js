// MODEL (the M in MVC): defines what a User looks like in the database.
// Phase 2 (auth) will use this. Every other model follows this same pattern.
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: true }, // will be hashed in Phase 2 — never stored as plain text
    role: {
      type: String,
      enum: ["student", "mentor", "admin"], // the three GradBridge roles
      default: "student",
    },
  },
  { timestamps: true } // adds createdAt / updatedAt automatically
);

const User = mongoose.model("User", userSchema);
export default User;
