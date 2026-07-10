// CONTROLLER: profile management (FR #3).
// The logged-in user updates their own role-specific profile.

// Shape the user object we send back (same as auth controller).
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  studentProfile: user.studentProfile,
  mentorProfile: user.mentorProfile,
});

// PUT /api/users/profile  (protect middleware already loaded req.user)
export const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, phone, studentProfile, mentorProfile } = req.body;

    // Basic details anyone can change:
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    // Role-specific: students may only edit studentProfile, mentors only mentorProfile.
    if (user.role === "student" && studentProfile) {
      // Merge so a partial update doesn't wipe fields the form didn't send.
      user.studentProfile = { ...user.studentProfile?.toObject?.(), ...studentProfile };
    }
    if (user.role === "mentor" && mentorProfile) {
      const merged = { ...user.mentorProfile?.toObject?.(), ...mentorProfile };
      // verificationStatus is admin-only — never trust it from the client (FR #2).
      merged.verificationStatus = user.mentorProfile?.verificationStatus ?? "pending";
      user.mentorProfile = merged;
    }

    await user.save(); // runs schema validation (e.g., CGPA 0-4)

    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0].message;
      return res.status(400).json({ success: false, message: firstMessage });
    }
    next(err);
  }
};
