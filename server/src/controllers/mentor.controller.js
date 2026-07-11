// CONTROLLER: mentor directory for students.
// Ranking is RULE-BASED tag overlap (per spec — no AI here): we tokenize the
// student's profile and each mentor's tags and count meaningful overlaps.
import User from "../models/User.js";

// "MSc in CS, University of Toronto" → ["msc", "university", "toronto", ...]
const tokenize = (...values) =>
  values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3);

const STOPWORDS = new Set(["msc", "bsc", "phd", "university", "the", "and", "for", "with"]);

// GET /api/mentors  (students browse; only approved + visible mentors)
export const listMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({
      role: "mentor",
      "mentorProfile.verificationStatus": "approved",
      "mentorProfile.isVisible": true,
    }).lean();

    const p = req.user.studentProfile ?? {};
    const studentTokens = new Set(
      tokenize(p.preferredCountry, p.researchInterest, p.degree).filter((w) => !STOPWORDS.has(w))
    );

    const ranked = mentors
      .map((m) => {
        const mp = m.mentorProfile ?? {};
        const mentorTokens = tokenize(
          mp.qualification,
          mp.university,
          (mp.expertise ?? []).join(" ")
        ).filter((w) => !STOPWORDS.has(w));

        // Tag overlap: how many of the mentor's distinct tags appear in the
        // student's profile tokens.
        const matched = [...new Set(mentorTokens)].filter((t) => studentTokens.has(t));

        return {
          id: m._id,
          name: m.name,
          qualification: mp.qualification,
          university: mp.university,
          expertise: mp.expertise ?? [],
          availability: mp.availability,
          matchScore: matched.length,
          matchedOn: matched, // shown in the UI so the ranking is explainable
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, count: ranked.length, mentors: ranked });
  } catch (err) {
    next(err);
  }
};
