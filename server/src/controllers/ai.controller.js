// CONTROLLER: AI features powered by Gemini (Module 1 & 2 of the spec).
import { generateJSON } from "../services/gemini.js";
import { getRatesUSD } from "../services/exchangeRate.js";

// ---------- AI Budget & Cost Predictor ----------
// Spec: student inputs target country, city, lifestyle level → AI generates a
// realistic first-year cost breakdown, cross-checked against live exchange
// rates. Results are cached per request to reduce repeated API calls.

const costCache = new Map(); // key → { data, expires }
const COST_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // costs don't change daily

// The exact JSON shape we force Gemini to return (all amounts in USD).
const costSchema = {
  type: "object",
  properties: {
    tuitionPerYear: { type: "number" },
    visaFees: { type: "number" },
    flightOneWay: { type: "number" },
    healthInsurancePerYear: { type: "number" },
    housingDeposit: { type: "number" },
    monthlyLiving: { type: "number" },
    currencyLocal: { type: "string", description: "ISO code like CAD or GBP" },
    notes: {
      type: "array",
      items: { type: "string" },
      description: "3-4 short practical tips specific to this city and lifestyle",
    },
  },
  required: [
    "tuitionPerYear", "visaFees", "flightOneWay", "healthInsurancePerYear",
    "housingDeposit", "monthlyLiving", "currencyLocal", "notes",
  ],
};

// POST /api/ai/cost-predictor   body: { country, city, lifestyle }
export const predictCost = async (req, res, next) => {
  try {
    const country = (req.body.country || "").trim();
    const city = (req.body.city || "").trim();
    const lifestyle = ["frugal", "moderate", "comfortable"].includes(req.body.lifestyle)
      ? req.body.lifestyle
      : "moderate";

    if (!country) {
      return res.status(400).json({ success: false, message: "Please provide a target country." });
    }

    // Per-request cache (spec requirement): same country+city+lifestyle
    // within 24h → no repeated Gemini call.
    const key = `${country}|${city}|${lifestyle}`.toLowerCase();
    const hit = costCache.get(key);
    if (hit && hit.expires > Date.now()) {
      return res.json({ success: true, cached: true, ...hit.data });
    }

    const prompt = `You are a study-abroad cost advisor for Bangladeshi students starting a Master's degree.

Estimate realistic FIRST-YEAR costs in USD for an international graduate student:
- Destination: ${city ? `${city}, ` : ""}${country}
- Lifestyle: ${lifestyle} (frugal = shared housing & cooking at home, moderate = balanced, comfortable = own studio & eating out)

Rules:
- tuitionPerYear: typical public-university international tuition for that country (use an average, not the most expensive school).
- monthlyLiving: rent share + food + transport + phone for that lifestyle in that city.
- Use current realistic prices. Be honest, not optimistic.
- notes: 3-4 short practical money tips specific to this destination and lifestyle.`;

    // 1) AI estimate + 2) live exchange rates, then cross-check into BDT.
    const [estimate, rates] = await Promise.all([
      generateJSON(prompt, costSchema),
      getRatesUSD(),
    ]);

    const yearlyLiving = estimate.monthlyLiving * 12;
    const totalUSD =
      estimate.tuitionPerYear + estimate.visaFees + estimate.flightOneWay +
      estimate.healthInsurancePerYear + estimate.housingDeposit + yearlyLiving;

    const bdtRate = rates.BDT ?? null;
    const localRate = rates[estimate.currencyLocal] ?? null;

    const data = {
      input: { country, city: city || null, lifestyle },
      breakdownUSD: {
        tuitionPerYear: estimate.tuitionPerYear,
        visaFees: estimate.visaFees,
        flightOneWay: estimate.flightOneWay,
        healthInsurancePerYear: estimate.healthInsurancePerYear,
        housingDeposit: estimate.housingDeposit,
        monthlyLiving: estimate.monthlyLiving,
        yearlyLiving,
      },
      totalUSD: Math.round(totalUSD),
      totalBDT: bdtRate ? Math.round(totalUSD * bdtRate) : null,
      exchange: {
        usdToBdt: bdtRate,
        currencyLocal: estimate.currencyLocal,
        usdToLocal: localRate,
        source: "open.er-api.com (live)",
      },
      notes: estimate.notes,
    };

    costCache.set(key, { data, expires: Date.now() + COST_CACHE_TTL_MS });

    res.json({ success: true, cached: false, ...data });
  } catch (err) {
    next(err);
  }
};

// ---------- AI Eligibility & Gap Analyzer ----------
// Spec: compare the student's academic profile against program requirements →
// eligibility verdict + AI explanation of exactly what is missing.

const eligibilityCache = new Map();
const ELIG_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const eligibilitySchema = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["eligible", "borderline", "not-eligible"] },
    summary: {
      type: "string",
      description: "2-3 sentence honest overall assessment, spoken directly to the student",
    },
    gaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          area: { type: "string", description: "e.g. English test, CGPA, Research experience" },
          requirement: { type: "string", description: "what this program typically requires" },
          yourStatus: { type: "string", description: "what the student currently has" },
          severity: { type: "string", enum: ["critical", "moderate", "minor"] },
          advice: { type: "string", description: "one concrete step to close this gap" },
        },
        required: ["area", "requirement", "yourStatus", "severity", "advice"],
      },
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "2-3 things in this profile that help the application",
    },
  },
  required: ["verdict", "summary", "gaps", "strengths"],
};

// POST /api/ai/eligibility   body: { university, program, degreeLevel }
export const analyzeEligibility = async (req, res, next) => {
  try {
    const university = (req.body.university || "").trim();
    const program = (req.body.program || "").trim();
    const degreeLevel = ["Masters", "PhD"].includes(req.body.degreeLevel)
      ? req.body.degreeLevel
      : "Masters";

    if (!university || !program) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a university and a program." });
    }

    // The analysis is only as good as the profile — require the essentials.
    const p = req.user.studentProfile ?? {};
    if (p.cgpa == null || !p.degree) {
      return res.status(400).json({
        success: false,
        message: "Complete your academic profile first (degree and CGPA) — the analyzer compares it against program requirements.",
      });
    }

    const english =
      p.englishTest?.name && p.englishTest.name !== "None"
        ? `${p.englishTest.name} ${p.englishTest.score ?? "(score not given)"}`
        : "No English test taken yet";

    // Cache key includes profile values: if the student updates CGPA or IELTS,
    // they get a fresh analysis instead of a stale cached one.
    const key = `${req.user.id}|${university}|${program}|${degreeLevel}|${p.cgpa}|${english}`.toLowerCase();
    const hit = eligibilityCache.get(key);
    if (hit && hit.expires > Date.now()) {
      return res.json({ success: true, cached: true, ...hit.data });
    }

    const prompt = `You are an honest graduate-admissions advisor for Bangladeshi students.

Assess this student's eligibility for: ${degreeLevel} in ${program} at ${university}.

Student profile:
- Bachelor's degree: ${p.degree}
- CGPA: ${p.cgpa} out of 4.0
- English test: ${english}
- Research interest: ${p.researchInterest || "not specified"}

Use the TYPICAL published admission requirements for this university and program
(minimum CGPA/GPA equivalent, English test minimums, research/publication
expectations${degreeLevel === "PhD" ? ", supervisor fit and research proposal" : ""}).

Rules:
- Be honest, not encouraging: if the profile falls short, say "not-eligible" and explain.
- "borderline" means meets minimums but weak against the typical admitted cohort.
- Every gap needs ONE concrete, actionable step (e.g., "Retake IELTS aiming for 7.0 — offered twice monthly in Dhaka").
- If the English test is missing, that is always a gap (severity critical for most programs).
- List genuine strengths too — what should this student emphasize in their application?`;

    const analysis = await generateJSON(prompt, eligibilitySchema);

    const data = {
      input: { university, program, degreeLevel },
      profileUsed: { degree: p.degree, cgpa: p.cgpa, english },
      ...analysis,
    };

    eligibilityCache.set(key, { data, expires: Date.now() + ELIG_CACHE_TTL_MS });

    res.json({ success: true, cached: false, ...data });
  } catch (err) {
    next(err);
  }
};
