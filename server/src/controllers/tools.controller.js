// CONTROLLER: rule-based decision tools (Module 3).
// NO AI here on purpose — the spec requires a weighted-sum formula and
// pure arithmetic, which are transparent and explainable to the student.
import destinations from "../data/destinations.js";
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
