// CONTROLLER: admin-only actions (FR #2 — role & access management).
// All routes using these are guarded by protect + authorize("admin").
import User from "../models/User.js";

// GET /api/admin/mentors?status=pending|approved|rejected|all
export const listMentors = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;

    const filter = { role: "mentor" };
    if (status !== "all") {
      filter["mentorProfile.verificationStatus"] = status;
    }

    const mentors = await User.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: mentors.length,
      mentors: mentors.map((m) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        phone: m.phone,
        appliedAt: m.createdAt,
        ...m.mentorProfile?.toObject?.(),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/mentors/:id/status   body: { status: "approved" | "rejected" }
export const setMentorStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status must be approved, rejected, or pending." });
    }

    const mentor = await User.findOne({ _id: req.params.id, role: "mentor" });
    if (!mentor) {
      return res.status(404).json({ success: false, message: "Mentor not found." });
    }

    mentor.mentorProfile.verificationStatus = status;
    await mentor.save();

    res.json({
      success: true,
      message: `${mentor.name} is now ${status}.`,
      mentor: { id: mentor._id, verificationStatus: status },
    });
  } catch (err) {
    next(err);
  }
};
