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

const meaningful = (...values) => tokenize(...values).filter((w) => !STOPWORDS.has(w));

// The three profile fields the rule matches on, in the order we show them.
// Labelling them lets the UI explain the ranking in human terms ("matched on
// your research interest") instead of just printing raw tokens.
const criteriaFor = (p = {}) =>
  [
    { label: "Preferred country", value: p.preferredCountry },
    { label: "Research interest", value: p.researchInterest },
    { label: "Degree background", value: p.degree },
  ].filter((c) => c.value);

// GET /api/mentors  (students browse; only approved + visible mentors)
export const listMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({
      role: "mentor",
      "mentorProfile.verificationStatus": "approved",
      "mentorProfile.isVisible": true,
    }).lean();

    const p = req.user.studentProfile ?? {};
    const criteria = criteriaFor(p);
    const studentTokens = new Set(meaningful(p.preferredCountry, p.researchInterest, p.degree));

    const ranked = mentors
      .map((m) => {
        const mp = m.mentorProfile ?? {};
        const mentorTokens = meaningful(
          mp.qualification,
          mp.university,
          (mp.expertise ?? []).join(" ")
        );
        const mentorTokenSet = new Set(mentorTokens);

        // Tag overlap: how many of the mentor's distinct tags appear in the
        // student's profile tokens.
        const matched = [...mentorTokenSet].filter((t) => studentTokens.has(t));

        // Per-criterion verdict, so the UI can say WHICH part of the profile
        // matched rather than only how many tokens did. Same rule, audited
        // one field at a time — that is what "rule-based" should look like.
        const breakdown = criteria.map((c) => {
          const hits = meaningful(c.value).filter((t) => mentorTokenSet.has(t));
          return { label: c.label, value: c.value, matched: hits.length > 0, hits };
        });

        return {
          id: m._id,
          name: m.name,
          qualification: mp.qualification,
          university: mp.university,
          expertise: mp.expertise ?? [],
          availability: mp.availability,
          matchScore: matched.length,
          matchedOn: matched, // shown in the UI so the ranking is explainable
          breakdown,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      count: ranked.length,
      // What the student was matched ON — lets the page show the inputs to the
      // rule, and prompt them to fill gaps that would improve their matches.
      criteria,
      maxScore: ranked[0]?.matchScore ?? 0,
      mentors: ranked,
    });
  } catch (err) {
    next(err);
  }
};
