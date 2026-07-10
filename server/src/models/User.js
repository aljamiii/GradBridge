// MODEL (the M in MVC): defines what a User looks like in the database.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },
    phone: { type: String, trim: true },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned by queries unless explicitly asked for
    },
    role: {
      type: String,
      enum: ["student", "mentor", "admin"], // the three GradBridge roles
      default: "student",
    },

    // --- Student academic profile (FR #1) — filled in via Profile Setup ---
    studentProfile: {
      degree: String, // e.g., "BSc in CSE"
      cgpa: { type: Number, min: 0, max: 4 },
      englishTest: {
        name: { type: String, enum: ["IELTS", "TOEFL", "Duolingo", "None"] },
        score: Number,
      },
      researchInterest: String,
      preferredCountry: String,
      budgetUSD: Number, // yearly budget in USD
    },

    // --- Mentor/Ambassador profile (FR #1) ---
    mentorProfile: {
      qualification: String, // e.g., "MSc, University of Toronto"
      university: String,
      expertise: [String], // e.g., ["SOP review", "Canada visas"]
      isVerified: { type: Boolean, default: false }, // admin approves (FR #2)
    },
  },
  { timestamps: true }
);

// Before saving: hash the password (only if it was created/changed).
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method: compare a login attempt against the stored hash.
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
