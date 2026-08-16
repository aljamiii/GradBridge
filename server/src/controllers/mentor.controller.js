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
import Booking from "../models/Booking.js";

// Below this many answered requests, a rate is noise dressed up as evidence
// ("100% confirmed" from a single booking). We hide it rather than mislead.
const MIN_RESPONSES_FOR_RATE = 3;

const median = (nums) => {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// Track record per mentor, computed from bookings that already exist — nothing
// here is self-reported, which is the whole point of showing it.
// ONE aggregation for every mentor on the page, not a query per card.
const trackRecordFor = async (mentorIds) => {
  const now = new Date();
  const rows = await Booking.aggregate([
    { $match: { mentor: { $in: mentorIds } } },
    {
      $group: {
        _id: "$mentor",
        completed: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$status", "confirmed"] }, { $lt: ["$start", now] }] }, 1, 0],
          },
        },
        confirmed: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
        declined: { $sum: { $cond: [{ $eq: ["$status", "declined"] }, 1, 0] } },
        // Milliseconds from request to the mentor's answer. Prefer the
        // explicit stamp; fall back to updatedAt for rows created before the
        // field existed. Null for anything the mentor hasn't answered.
        responseMs: {
          $push: {
            $cond: [
              { $in: ["$status", ["confirmed", "declined"]] },
              { $subtract: [{ $ifNull: ["$respondedAt", "$updatedAt"] }, "$createdAt"] },
              null,
            ],
          },
        },
      },
    },
  ]);

  const byMentor = new Map();
  for (const r of rows) {
    const answered = r.confirmed + r.declined;
    const times = r.responseMs.filter((ms) => typeof ms === "number" && ms >= 0);
    byMentor.set(String(r._id), {
      sessionsCompleted: r.completed,
      // Rates need enough answers to mean anything.
      confirmRate: answered >= MIN_RESPONSES_FOR_RATE ? r.confirmed / answered : null,
      responsesCounted: answered,
      medianResponseHours:
        times.length >= MIN_RESPONSES_FOR_RATE
          ? Math.round((median(times) / 3600000) * 10) / 10
          : null,
    });
  }
  return byMentor;
};

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

// The student's immediate need, chosen on the page rather than stored on the
// profile — "who is like me" is a different question from "who can help me
// with the thing I'm stuck on this week".
//
// The vocabulary is the SAME fixed list as the Network Map's `helpWith` chips
// (User.studentProfile.abroad.helpWith). Mentors write their expertise as free
// text, so each need carries the keywords that identify it — matching a need
// to "Canada visas" or "Sweden residence permit" can't be done by string
// equality. Weighted above every profile criterion because a stated need beats
// an inferred similarity.
const NEED_WEIGHT = 4;
const NEEDS = [
  { key: "visa", label: "Visa", keywords: ["visa", "visas", "immigration", "permit", "residence"] },
  { key: "housing", label: "Housing", keywords: ["housing", "accommodation", "rent", "hostel"] },
  {
    key: "funding",
    label: "Funding",
    keywords: ["funding", "scholarship", "scholarships", "assistantship", "blocked", "financial"],
  },
  {
    key: "part-time jobs",
    label: "Part-time jobs",
    keywords: ["part", "time", "jobs", "work", "careers", "career"],
  },
  {
    key: "admissions",
    label: "Admissions",
    keywords: ["admissions", "admission", "sop", "statement", "application", "applications", "ielts"],
  },
  {
    key: "settling in",
    label: "Settling in",
    keywords: ["settling", "settle", "culture", "community"],
  },
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

    const trackRecord = await trackRecordFor(mentors.map((m) => m._id));

    const p = req.user.studentProfile ?? {};

    // ?need=visa — validated against the fixed vocabulary, so an unknown or
    // hand-typed value is simply ignored rather than silently skewing ranks.
    const need = NEEDS.find((n) => n.key === String(req.query.need ?? "").toLowerCase());

    const criteria = [
      ...(need
        ? [
            {
              label: "Need help with",
              value: need.label,
              weight: NEED_WEIGHT,
              kind: "need",
              keywords: need.keywords,
            },
          ]
        : []),
      ...criteriaFor(p),
    ];
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
          } else if (c.kind === "need") {
            // Report the mentor's own tags that cover the need, not the
            // internal keywords — "Canada visas" is what the student recognises.
            const keywords = new Set(c.keywords);
            hits = (mp.expertise ?? []).filter((tag) =>
              meaningful(tag).some((t) => keywords.has(t))
            );
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
          // Deliberately NOT folded into matchScore: the match answers
          // "relevant", the track record answers "reliable". Blending them
          // would destroy the auditability of the ranking.
          trackRecord: trackRecord.get(String(m._id)) ?? {
            sessionsCompleted: 0,
            confirmRate: null,
            responsesCounted: 0,
            medianResponseHours: null,
          },
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
      // The vocabulary lives on the server so the chips and the matcher can
      // never drift apart.
      needOptions: NEEDS.map((n) => ({ key: n.key, label: n.label })),
      need: need?.key ?? null,
      mentors: ranked,
    });
  } catch (err) {
    next(err);
  }
};
