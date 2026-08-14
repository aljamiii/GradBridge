// CONTROLLER: AI features powered by Gemini (Module 1 & 2 of the spec).
import { generateJSON, generateText, embedText } from "../services/gemini.js";
import { getRatesUSD } from "../services/exchangeRate.js";
import { getWeather } from "../services/weather.js";
import KnowledgeChunk from "../models/KnowledgeChunk.js";

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

// ---------- AI Destination Advisor (RAG) ----------
// Spec: free-form questions about a city/country → the AI retrieves live
// weather data and a curated knowledge base to generate accurate,
// location-specific answers.
//
// The RAG loop:
//   1. EMBED the question into a vector
//   2. RETRIEVE the most similar knowledge chunks — Atlas Vector Search
//      ($vectorSearch), with an in-memory cosine scan as automatic fallback
//   3. AUGMENT the prompt with those chunks + live weather
//   4. GENERATE an answer grounded ONLY in that context

// Cosine similarity: 1 = same meaning, 0 = unrelated.
const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
};

// FALLBACK path only: keep all chunks in memory and compare in-app.
// Reload every 10 minutes so a re-seed is picked up without restarting.
let chunkCache = null;
let chunkCacheExpires = 0;
const loadChunks = async () => {
  if (chunkCache && chunkCacheExpires > Date.now()) return chunkCache;
  chunkCache = await KnowledgeChunk.find({}).lean();
  chunkCacheExpires = Date.now() + 10 * 60 * 1000;
  return chunkCache;
};

const TOP_K = 4;             // how many chunks to hand to Gemini
const MIN_SIMILARITY = 0.45; // raw cosine — below this, a chunk is probably irrelevant
const VECTOR_INDEX = "knowledge_vector_index"; // created by scripts/createVectorIndex.js

// Detect whether the student's question explicitly mentions
// one of the destinations covered by our knowledge base.
const findMentionedDestination = async (text) => {
  const chunks = await loadChunks();

  const destinations = [
    ...new Map(
      chunks.map((c) => [
        `${c.city}|${c.country}`,
        { city: c.city, country: c.country },
      ])
    ).values(),
  ];

  const lower = text.toLowerCase();

  return (
    destinations.find(
      (d) =>
        lower.includes(d.city.toLowerCase()) ||
        lower.includes(d.country.toLowerCase())
    ) || null
  );
};

// Retrieval has two paths:
//   PRIMARY  — Atlas Vector Search: the DB's own vector index finds the nearest
//              chunks, like any other indexed query. Scales past a for-loop.
//   FALLBACK — the original in-memory cosine scan, used automatically when the
//              index doesn't exist yet or we're on non-Atlas MongoDB, so the
//              feature never breaks (fail-soft, same pattern as weather).
// Returns { scored, retrieval } — `retrieval` names the path that ran.
const retrieveChunks = async (qVector) => {
  try {
    const results = await KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index: VECTOR_INDEX,
          path: "embedding",
          queryVector: qVector,
          numCandidates: 100, // entries considered before ranking (>= limit)
          limit: TOP_K,
        },
      },
      { $project: { city: 1, country: 1, topic: 1, text: 1, score: { $meta: "vectorSearchScore" } } },
    ]);
    if (results.length > 0) {
      return {
        // Atlas reports cosine normalized to (1 + cos) / 2 — convert back to
        // raw cosine so the 0.45 threshold and the similarity % shown in the
        // UI mean exactly what they did before.
        scored: results
          .map((c) => ({ ...c, score: c.score * 2 - 1 }))
          .filter((c) => c.score >= MIN_SIMILARITY),
        retrieval: "atlas-vector-search",
      };
    }
    // Zero results usually means the index doesn't exist — $vectorSearch
    // returns nothing (not an error) for a missing index → fall through.
  } catch {
    // Non-Atlas MongoDB rejects the $vectorSearch stage → fall through.
  }

  const chunks = await loadChunks();
  return {
    scored: chunks
      .map((c) => ({ ...c, score: cosine(qVector, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
      .filter((c) => c.score >= MIN_SIMILARITY),
    retrieval: "in-memory-cosine",
  };
};

// POST /api/ai/destination-advisor   body: { question }
export const askDestinationAdvisor = async (req, res, next) => {
  try {
    const question = (req.body.question || "").trim();

    const history = Array.isArray(req.body.history)  // add history handling (follow up questions), like- is toronto safe? how safe is it? (here, "it" will mean "toronto")
      ? req.body.history.slice(-3)  
      : [];

    if (question.length < 5) {
      return res.status(400).json({ success: false, message: "Please ask a full question." });
    }

    // 1. EMBED the question
    const historyText = history
      .map(
        (item) =>
          `Previous question: ${item.question || ""}\nPrevious answer: ${item.answer || ""}`
      )
      .join("\n\n");

    const retrievalQuery = historyText
      ? `${historyText}\n\nCurrent question: ${question}`
      : question;
    
    // First give priority to a destination explicitly mentioned
    // in the CURRENT question.
    let mentionedDestination =
      await findMentionedDestination(question);

    // If the current question does not mention a city/country,
    // use recent conversation history for follow-up questions
    // such as "how safe is it?" or "what about rent?"
    if (!mentionedDestination && history.length > 0) {
      // Search history from newest → oldest so follow-up questions
      // refer to the most recently discussed destination.
      for (let i = history.length - 1; i >= 0; i--) {
        const recentContext =
          `${history[i].question || ""} ${history[i].answer || ""}`;

        mentionedDestination =
          await findMentionedDestination(recentContext);

        if (mentionedDestination) {
          break;
        }
      }
    }

    const qVector = await embedText(retrievalQuery);

    // 2. RETRIEVE top-K most similar chunks (vector index, or in-memory fallback)
    const retrievalResult = await retrieveChunks(qVector);

    let scored = retrievalResult.scored;
    const retrieval = retrievalResult.retrieval;

    // KEEP RESULTS IN THE CORRECT CITY
    if (mentionedDestination) {
      scored = scored.filter(
        (c) =>
          c.city.toLowerCase() ===
          mentionedDestination.city.toLowerCase()
      );

      // If Atlas top results missed the intended city,
      // do a focused cosine search over that city's chunks.
      if (scored.length === 0) {
        const chunks = await loadChunks();

        scored = chunks
          .filter(
            (c) =>
              c.city.toLowerCase() ===
              mentionedDestination.city.toLowerCase()
          )
          .map((c) => ({
            ...c,
            score: cosine(qVector, c.embedding),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, TOP_K)
          .filter((c) => c.score >= MIN_SIMILARITY);
      }
    }

    if (scored.length === 0 && (await KnowledgeChunk.estimatedDocumentCount()) === 0) {
      return res.status(503).json({
        success: false,
        message: "Knowledge base is empty — run: node src/scripts/seedKnowledge.js",
      });
    }

    // 3. AUGMENT: live weather for the city the best chunks are about
    const topCity = mentionedDestination
      ? mentionedDestination
      : scored[0]
        ? {
            city: scored[0].city,
            country: scored[0].country,
          }
        : null;
    const weather = topCity ? await getWeather(topCity.city) : null;

    const context = scored
      .map((c, i) => `[Source ${i + 1}: ${c.city}, ${c.country} — ${c.topic}]\n${c.text}`)
      .join("\n\n");

    const weatherLine = weather
      ? `\n\nLIVE WEATHER RIGHT NOW in ${weather.city}: ${weather.tempC}°C (feels like ${weather.feelsLikeC}°C), ${weather.description}, humidity ${weather.humidity}%.`
      : "";

    const conversationContext = history.length
      ? history
          .map(
            (item) =>
              `Student: ${item.question || ""}\nAdvisor: ${item.answer || ""}`
          )
          .join("\n\n")
      : "(no previous conversation)";

    const prompt = `You are GradBridge's destination advisor for Bangladeshi students planning to study abroad.

Answer the student's current question using ONLY the retrieved context below.

Rules:
- The conversation history may help you understand references such as "it", "there", "that place", "what about rent?", or other follow-up wording.
- Conversation history is ONLY for understanding what the student means.
- Factual claims must still come from the retrieved context or live weather.
- If the retrieved context doesn't contain the answer, say honestly that your guide doesn't cover it yet and suggest asking a country ambassador — DO NOT invent facts.
- Be specific and practical; write 1 short paragraph or a few bullet points, not an essay.
- If live weather is provided and relevant, weave it in naturally.
- Answer in the same language the student asked in (English or Bangla).

RECENT CONVERSATION:
${conversationContext}

RETRIEVED CONTEXT:
${context || "(no relevant guide sections found)"}${weatherLine}

CURRENT STUDENT QUESTION:
${question}`;

    // 4. GENERATE
    const answer = await generateText(prompt);

    res.json({
      success: true,
      answer,
      retrieval, // "atlas-vector-search" or "in-memory-cosine" — proof of path
      sources: scored.map((c) => ({
        city: c.city,
        country: c.country,
        topic: c.topic,
        similarity: Math.round(c.score * 100) / 100,
      })),
      weather,
    });
  } catch (err) {
    next(err);
  }
};

// ---------- AI Visa & Document Checklist Generator ----------
// Spec (Module 2 #4): personalized checklist from nationality (Bangladeshi),
// target country, and program type + reminder draft content.

const visaCache = new Map();
const VISA_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // visa rules change slowly

const visaSchema = {
  type: "object",
  properties: {
    visaType: { type: "string", description: "official visa name, e.g. Canada Study Permit (SDS)" },
    processingTimeWeeks: { type: "string", description: "typical range, e.g. '4-8'" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          document: { type: "string" },
          category: {
            type: "string",
            enum: ["identity", "academic", "financial", "medical", "visa-forms"],
          },
          details: { type: "string", description: "one sentence: what exactly, from where" },
          urgency: {
            type: "string",
            enum: ["start-now", "before-applying", "after-admission"],
            description: "start-now = takes weeks (police clearance, IELTS); after-admission = needs the offer letter",
          },
        },
        required: ["document", "category", "details", "urgency"],
      },
    },
    reminderDraft: {
      type: "string",
      description: "a short friendly reminder message we can email the student as deadlines approach",
    },
    tips: { type: "array", items: { type: "string" }, description: "2-3 Bangladesh-specific tips" },
  },
  required: ["visaType", "processingTimeWeeks", "items", "reminderDraft", "tips"],
};

// POST /api/ai/visa-checklist   body: { country, degreeLevel }
export const generateVisaChecklist = async (req, res, next) => {
  try {
    const country = (req.body.country || "").trim();
    const degreeLevel = ["Masters", "PhD"].includes(req.body.degreeLevel)
      ? req.body.degreeLevel
      : "Masters";
    if (!country) {
      return res.status(400).json({ success: false, message: "Please provide a target country." });
    }

    const key = `${country}|${degreeLevel}`.toLowerCase();
    const hit = visaCache.get(key);
    if (hit && hit.expires > Date.now()) {
      return res.json({ success: true, cached: true, ...hit.data });
    }

    const prompt = `You are a study-visa advisor for BANGLADESHI students.

Build the complete document checklist for a Bangladeshi citizen applying for a
student visa to study a ${degreeLevel} in ${country}.

Rules:
- Use the correct current visa name and typical processing time for Bangladeshi applicants.
- Include Bangladesh-specific documents where relevant (police clearance from
  Bangladesh Police, notarized bank solvency certificates, sponsor affidavits).
- urgency "start-now" for anything that takes weeks to obtain in Bangladesh.
- reminderDraft: a short, friendly reminder message (2-3 sentences) addressed to
  the student about upcoming deadlines, with a placeholder {DEADLINE_DATE}.
- tips: practical, Bangladesh-specific (embassy/VFS location, common rejection reasons).`;

    const checklist = await generateJSON(prompt, visaSchema);

    const data = { input: { country, degreeLevel, nationality: "Bangladeshi" }, ...checklist };
    visaCache.set(key, { data, expires: Date.now() + VISA_CACHE_TTL_MS });

    res.json({ success: true, cached: false, ...data });
  } catch (err) {
    next(err);
  }
};
