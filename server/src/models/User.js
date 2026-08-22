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
      researchExperience: {
        hasExperience: { type: Boolean, default: false },
        months: { type: Number, min: 0, default: 0 },
        experienceType: {
          type: String,
          enum: [
            "None",
            "Undergraduate thesis",
            "Research project",
            "Research assistant",
            "Laboratory research",
            "Industry research",
            "Other",
          ],
          default: "None",
        },
        description: {
          type: String,
          trim: true,
          maxlength: 1000,
        },
        publications: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
      preferredCountry: String,
      budgetUSD: Number, // yearly budget in USD

      // Lifestyle preferences (FR #3) — feed the AI compatibility/risk features
      weatherTolerance: {
        type: String,
        enum: ["prefer-warm", "prefer-cold", "no-preference"],
      },
      communityPriority: {
        type: String, // how important is a Bangladeshi/Muslim community nearby?
        enum: ["low", "medium", "high"],
      },

      // Network Map: students ALREADY abroad can opt in to be plotted so
      // future students can find peers in their target city.
      abroad: {
        optIn: { type: Boolean, default: false },
        city: String,
        country: String,
        university: String,
        degreeLevel: { type: String, enum: ["Bachelors", "Masters", "PhD"] },
        subject: String, // e.g., "Computer Science"
        // What this student is happy to help newcomers with — powers the
        // map's "who can help with X" filter. Fixed vocabulary so it's
        // filterable (free text wouldn't be).
        helpWith: {
          type: [{
            type: String,
            enum: ["visa", "housing", "funding", "part-time jobs", "admissions", "settling in"],
          }],
          default: [],
        },
        lat: Number, // geocoded server-side via Nominatim
        lng: Number,
        // The same coordinates as GeoJSON, so the 2dsphere index below can
        // answer real geospatial queries ($geoNear). GeoJSON order is
        // [lng, lat] — the classic gotcha, opposite of how humans say it.
        location: {
          type: { type: String, enum: ["Point"] },
          coordinates: { type: [Number], default: undefined }, // [lng, lat]
        },
      },
    },

    // --- Mentor/Ambassador profile (FR #1) ---
    mentorProfile: {
      qualification: String, // e.g., "MSc, University of Toronto"
      university: String,
      // Where the mentor actually studies. Matching used to infer this from
      // the expertise tags, so a mentor in Toronto only counted as "Canada"
      // if they happened to tag "Canada visas" — a real field makes the
      // country criterion exact instead of accidental.
      country: String,
      city: String,
      expertise: [String], // e.g., ["SOP review", "Canada visas"]
      availability: String, // e.g., "Weekends, 8-10pm BD time"
      isVisible: { type: Boolean, default: true }, // mentor can hide from search
      // Admin decision (FR #2): only "approved" mentors appear in student search.
      verificationStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  },
  { timestamps: true }
);

// Geospatial index over abroad students' pins: lets $geoNear find "students
// within N km of this point" straight from the index instead of scanning.
userSchema.index({ "studentProfile.abroad.location": "2dsphere" });

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
