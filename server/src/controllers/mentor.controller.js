// CONTROLLER: mentor directory for students.
// Ranking is RULE-BASED (per spec — no AI here): each profile criterion either
// matches or it doesn't, and matched criteria contribute a fixed weight.
//
// Why per-criterion and not per-token: counting shared tokens made the score
// depend on how wordy a profile was. "Machine Learning" (2 words) outweighed
// "Canada" (1 word) purely by grammar, and rewriting an interest as "AI" would
// silently halve its influence. Weights below are a deliberate decision that
// can be defended; token counts were an accident of phrasing.
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

// Country is compared as a whole value, not tokenized — "United Kingdom" must
// not match on the word "united".
const normalizeCountry = (v) => (v ?? "").trim().toLowerCase();

// The rule, as data. Weight = how much this criterion is worth when it hits.
// Research interest is what a mentoring session is actually *about*, so it
// outranks geography; shared degree background is a nice-to-have tiebreaker.
const CRITERIA = [
  { key: "researchInterest", label: "Research interest", weight: 3, kind: "tokens" },
  { key: "preferredCountry", label: "Preferred country", weight: 2, kind: "country" },
  { key: "degree", label: "Degree background", weight: 1, kind: "tokens" },
];

// Only criteria the student has actually filled in count toward the maximum,
// so an incomplete profile can't make every mentor look like a poor match.
const criteriaFor = (p = {}) =>
  CRITERIA.map((c) => ({ ...c, value: p[c.key] })).filter((c) => c.value);

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
    const maxScore = criteria.reduce((sum, c) => sum + c.weight, 0);

    const ranked = mentors
      .map((m) => {
        const mp = m.mentorProfile ?? {};
        const mentorTokens = new Set(
          meaningful(mp.qualification, mp.university, (mp.expertise ?? []).join(" "))
        );

        const breakdown = criteria.map((c) => {
          let hits = [];
          if (c.kind === "country") {
            // Exact field comparison — no longer inferred from tag wording.
            hits =
              mp.country && normalizeCountry(mp.country) === normalizeCountry(c.value)
                ? [mp.country]
                : [];
          } else {
            hits = [...new Set(meaningful(c.value))].filter((t) => mentorTokens.has(t));
          }
          return {
            label: c.label,
            value: c.value,
            weight: c.weight,
            matched: hits.length > 0,
            hits,
          };
        });

        // A criterion is worth its weight whether it matched on one word or
        // three — that is the whole point of the change.
        const matchScore = breakdown.reduce((sum, b) => sum + (b.matched ? b.weight : 0), 0);

        return {
          id: m._id,
          name: m.name,
          qualification: mp.qualification,
          university: mp.university,
          country: mp.country,
          city: mp.city,
          expertise: mp.expertise ?? [],
          availability: mp.availability,
          matchScore,
          matchedOn: breakdown.filter((b) => b.matched).flatMap((b) => b.hits),
          breakdown,
        };
      })
      // Name is the tiebreaker so equal scores render in a stable order
      // instead of whatever order Mongo happened to return.
      .sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name));

    res.json({
      success: true,
      count: ranked.length,
      criteria: criteria.map((c) => ({ label: c.label, value: c.value, weight: c.weight })),
      maxScore, // the ceiling the rule can reach, not the best mentor's score
      mentors: ranked,
    });
  } catch (err) {
    next(err);
  }
};
