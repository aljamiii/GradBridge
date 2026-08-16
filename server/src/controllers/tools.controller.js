// CONTROLLER: rule-based decision tools (Module 3).
// NO AI here on purpose — the spec requires a weighted-sum formula and
// pure arithmetic, which are transparent and explainable to the student.
import destinations from "../data/destinations.js";
import emailTemplates from "../data/emailTemplates.js";
import { getRatesUSD } from "../services/exchangeRate.js";

// ---------- Life Compatibility Score ----------
// Spec: student sets priority weights (budget, weather, community, safety);
// weighted sum over each destination's stored profile + template verdict.

const COMPONENT_LABELS = {
  budget: "budget",
  weather: "weather",
  community: "community",
  safety: "safety",
};

// POST /api/tools/compatibility   body: { weights: { budget, weather, community, safety } }
export const computeCompatibility = (req, res) => {
  const raw = req.body.weights ?? {};
  // Weights arrive as 0-10 sliders; clamp and guard against all-zeros.
  const weights = {};
  for (const key of Object.keys(COMPONENT_LABELS)) {
    weights[key] = Math.min(10, Math.max(0, Number(raw[key]) || 0));
  }
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  if (totalWeight === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Set at least one priority above zero." });
  }

  // Weather component respects the student's saved preference:
  // prefer-warm → warm cities score high; prefer-cold → inverted;
  // no preference → neutral 70 for everyone.
  const pref = req.user.studentProfile?.weatherTolerance ?? "no-preference";
  const weatherScore = (d) =>
    pref === "prefer-warm" ? d.warmth : pref === "prefer-cold" ? 100 - d.warmth : 70;

  const results = destinations
    .map((d) => {
      const components = {
        budget: d.affordability,
        weather: weatherScore(d),
        community: d.community,
        safety: d.safety,
      };

      // THE weighted-sum formula: Σ(score × weight) / Σ(weights)
      const score =
        Object.entries(components).reduce(
          (sum, [key, value]) => sum + value * weights[key],
          0
        ) / totalWeight;

      // Template verdict from the strongest/weakest WEIGHTED components
      // (only components the student actually cares about, weight ≥ 3).
      const cared = Object.entries(components).filter(([k]) => weights[k] >= 3);
      const pool = cared.length >= 2 ? cared : Object.entries(components);
      const best = pool.reduce((a, b) => (b[1] > a[1] ? b : a));
      const worst = pool.reduce((a, b) => (b[1] < a[1] ? b : a));
      const verdict = `Strong on ${COMPONENT_LABELS[best[0]]}, weak on ${COMPONENT_LABELS[worst[0]]}.`;

      return {
        city: d.city,
        country: d.country,
        score: Math.round(score),
        components,
        verdict,
      };
    })
    .sort((a, b) => b.score - a.score);

  res.json({ success: true, weatherPreference: pref, weights, results });
};

// ---------- Financial Risk & Savings Planner ----------
// Spec: predicted cost vs declared funding → shortfall, threshold risk level,
// required monthly savings by deadline, scholarship coverage. Pure arithmetic.

// POST /api/tools/financial-risk
// body: { totalCostUSD, fundingUSD, scholarshipUSD, deadline }
export const analyzeFinancialRisk = async (req, res, next) => {
  try {
    const cost = Number(req.body.totalCostUSD);
    const funding = Math.max(0, Number(req.body.fundingUSD) || 0);
    const scholarship = Math.max(0, Number(req.body.scholarshipUSD) || 0);
    if (!Number.isFinite(cost) || cost <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Enter your estimated first-year cost in USD." });
    }

    const shortfall = Math.max(0, cost - funding - scholarship);
    const shortfallRatio = shortfall / cost;

    // Threshold rules (spec: "assigns a risk level by threshold rules"):
    let risk, riskMessage;
    if (shortfall === 0) {
      risk = "safe";
      riskMessage = "Fully funded — your declared funding covers the estimated cost.";
    } else if (shortfallRatio <= 0.15) {
      risk = "low";
      riskMessage = "Small gap — closable with savings or on-campus part-time work.";
    } else if (shortfallRatio <= 0.35) {
      risk = "medium";
      riskMessage = "Meaningful gap — you need a concrete savings plan or partial scholarship before committing.";
    } else {
      risk = "high";
      riskMessage = "Large gap — do not rely on part-time work to close this; seek bigger scholarships or a cheaper destination.";
    }

    // Savings calculator: months until deadline (at least 1).
    const deadline = new Date(req.body.deadline);
    let monthsLeft = null;
    let monthlySavingsUSD = null;
    if (!Number.isNaN(deadline.getTime())) {
      monthsLeft = Math.max(
        1,
        Math.round((deadline - Date.now()) / (30.44 * 24 * 60 * 60 * 1000))
      );
      monthlySavingsUSD = Math.ceil(shortfall / monthsLeft);
    }

    const rates = await getRatesUSD().catch(() => null);
    const bdt = rates?.BDT ?? null;

    res.json({
      success: true,
      input: { totalCostUSD: cost, fundingUSD: funding, scholarshipUSD: scholarship },
      shortfallUSD: Math.round(shortfall),
      shortfallBDT: bdt ? Math.round(shortfall * bdt) : null,
      shortfallPercent: Math.round(shortfallRatio * 100),
      scholarshipCoveragePercent: Math.round((scholarship / cost) * 100),
      risk,
      riskMessage,
      monthsLeft,
      monthlySavingsUSD,
      monthlySavingsBDT: bdt && monthlySavingsUSD != null ? Math.round(monthlySavingsUSD * bdt) : null,
      usdToBdt: bdt,
    });
  } catch (err) {
    next(err);
  }
};

// ---------- Job Market & PR Points Calculator ----------
import { getJobStats, adzunaConfigured, ADZUNA_COUNTRIES } from "../services/adzuna.js";
import { canadaCRS, australiaPoints } from "../services/prPoints.js";

// GET /api/tools/job-market?country=Canada&field=software engineer
export const getJobMarket = async (req, res, next) => {
  try {
    if (!adzunaConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Job data isn't configured yet — add free ADZUNA_APP_ID and ADZUNA_APP_KEY to server/.env (developer.adzuna.com).",
      });
    }
    const country = (req.query.country || "").trim();
    const field = (req.query.field || "").trim();
    if (!country || !field) {
      return res.status(400).json({ success: false, message: "Provide a country and a field." });
    }
    const stats = await getJobStats(country, field);
    res.json({ success: true, country, field, ...stats, source: "Adzuna (live)" });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// GET /api/tools/job-market/countries — which countries the job data covers
export const getJobMarketCountries = (req, res) => {
  res.json({ success: true, countries: Object.keys(ADZUNA_COUNTRIES) });
};

// POST /api/tools/pr-points  body: { age, education, yearsExperience, ielts }
export const computePRPoints = (req, res) => {
  const age = Math.round(Number(req.body.age));
  const yearsExperience = Math.max(0, Number(req.body.yearsExperience) || 0);
  const ielts = Number(req.body.ielts) || 0;
  const education = ["highschool", "bachelors", "masters", "phd"].includes(req.body.education)
    ? req.body.education
    : "bachelors";

  if (!Number.isFinite(age) || age < 16 || age > 60) {
    return res.status(400).json({ success: false, message: "Enter a valid age (16-60)." });
  }

  const input = { age, education, yearsExperience, ielts };
  res.json({
    success: true,
    input,
    pathways: [canadaCRS(input), australiaPoints(input)],
    note: "Simplified estimates of the official points systems — always confirm on the official immigration sites.",
  });
};

// ---------- Supervisor Email Composer (Module 3) ----------
// Spec: a RULE-BASED mail merge — pick a template, fill placeholders from the
// form plus the student's saved profile, return subject + body. No AI: the
// student must be able to read, edit and defend every sentence they send.

// GET /api/tools/email-templates — list templates for the picker.
export const listEmailTemplates = (req, res) => {
  res.json({
    success: true,
    templates: emailTemplates.map(({ id, name, description }) => ({ id, name, description })),
  });
};

// POST /api/tools/compose-email
// body: { templateId, professorName, university, paperTitle, program, degreeLevel, intake }
export const composeEmail = (req, res) => {
  const template = emailTemplates.find((t) => t.id === req.body.templateId);
  if (!template) {
    return res.status(400).json({ success: false, message: "Pick an email template." });
  }

  const p = req.user.studentProfile ?? {};

  // One English-test sentence, built from the profile so the student never
  // claims a score they haven't got.
  const englishLine =
    p.englishTest?.name && p.englishTest.name !== "None" && p.englishTest.score != null
      ? `I have taken the ${p.englishTest.name} and scored ${p.englishTest.score}.`
      : "I am currently preparing for my English proficiency test and can share the score as soon as it is available.";

  const values = {
    studentName: req.user.name,
    email: req.user.email,
    degree: p.degree || "Bachelor's degree",
    cgpa: p.cgpa != null ? String(p.cgpa) : "—",
    researchInterest: p.researchInterest || "my research area",
    englishLine,
    professorName: (req.body.professorName || "").trim() || "{{professorName}}",
    university: (req.body.university || "").trim() || p.preferredCountry || "{{university}}",
    paperTitle: (req.body.paperTitle || "").trim() || "{{paperTitle}}",
    program: (req.body.program || "").trim() || p.researchInterest || "{{program}}",
    degreeLevel: ["Masters", "PhD"].includes(req.body.degreeLevel) ? req.body.degreeLevel : "Masters",
    intake: (req.body.intake || "").trim() || "the upcoming",
  };

  // THE mail merge: replace every {{key}} we have a value for.
  const fill = (text) =>
    text.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] ?? match);

  const subject = fill(template.subject);
  const body = fill(template.body);

  // Anything still in {{braces}} is a blank the student must fill in.
  const missing = [...new Set(body.concat(subject).match(/\{\{(\w+)\}\}/g) ?? [])]
    .map((m) => m.replace(/[{}]/g, ""));

  res.json({
    success: true,
    template: { id: template.id, name: template.name },
    subject,
    body,
    missing,
    mailto: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  });
};
