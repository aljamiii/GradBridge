// SERVICE: the Self-Updating Scholarship Aggregator pipeline (Module 1 #2).
//
//   1. FETCH each source page (Cheerio parses the HTML)
//   2. EXTRACT the readable text (we don't need fragile CSS selectors —
//      the AI does the understanding, per the spec)
//   3. PARSE with Gemini into clean structured fields + quality flags
//   4. DEDUPE via title+provider+deadline fingerprint (spec requirement)
//   5. SAVE — clean entries auto-approved, flagged ones go to admin review
import * as cheerio from "cheerio";
import Scholarship from "../models/Scholarship.js";
import { generateJSON } from "./gemini.js";

// Sources verified to serve static, scrape-friendly HTML.
export const SOURCES = [
  {
    name: "Scholars4Dev (Masters)",
    url: "https://www.scholars4dev.com/category/level-of-study/masters-scholarships/",
  },
  {
    name: "DAAD Scholarships (official)",
    url: "https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/",
  },
];

const parseSchema = {
  type: "object",
  properties: {
    scholarships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          provider: { type: "string", description: "university or organization offering it" },
          country: { type: "string", description: "study destination country; 'Multiple' if several" },
          degreeLevels: { type: "array", items: { type: "string", enum: ["Bachelors", "Masters", "PhD"] } },
          deadline: { type: "string", description: "as stated, e.g. '15 October 2026'; empty if not stated" },
          fundingType: { type: "string", enum: ["full", "partial", "varies", "unknown"] },
          eligibility: { type: "string", description: "1-2 sentence eligibility summary" },
          link: { type: "string", description: "the URL for this scholarship if present in the text" },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "low if key fields were guessed or the text was ambiguous",
          },
          likelyOutdated: {
            type: "boolean",
            description: "true if the deadline is in the past or the entry references a previous year's intake",
          },
          flagReason: { type: "string", description: "one sentence, only when likelyOutdated or confidence is low" },
        },
        required: ["title", "provider", "country", "degreeLevels", "deadline",
          "fundingType", "eligibility", "confidence", "likelyOutdated"],
      },
    },
  },
  required: ["scholarships"],
};

// Fetch a page and reduce it to readable text + links (max ~12k chars).
async function extractPageText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GradBridge-EduBot/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  const $ = cheerio.load(await res.text());

  $("script, style, nav, footer, header, form, iframe").remove();

  // Keep link URLs inline so the AI can attach them to entries.
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (text && href?.startsWith("http")) $(el).replaceWith(`${text} [${href}]`);
  });

  return $("body").text().replace(/\s+/g, " ").trim().slice(0, 12_000);
}

// "Erasmus Mundus 2026!" + "EU" + "oct 2026" → "erasmusmundus2026|eu|oct2026"
const fingerprintOf = (s) =>
  [s.title, s.provider, s.deadline]
    .map((v) => (v ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""))
    .join("|");

// Fuzzy fallback: the AI sometimes paraphrases a title between runs
// ("Master's Degree Scholarships" vs "Scholarships for a Master's degree"),
// which defeats exact fingerprints. Compare word sets instead.
const titleTokens = (title) =>
  new Set(
    (title ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !["the", "for", "and"].includes(w))
  );

const isSameScholarship = (titleA, titleB) => {
  const a = titleTokens(titleA);
  const b = titleTokens(titleB);
  if (a.size === 0 || b.size === 0) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  // Jaccard similarity ≥ 0.6 → same thing, differently worded.
  return shared / (a.size + b.size - shared) >= 0.6;
};

// Run the full pipeline over all sources. Returns a per-source report.
export async function runScraper() {
  const today = new Date().toISOString().slice(0, 10);
  const report = [];

  for (const source of SOURCES) {
    const entry = { source: source.name, found: 0, added: 0, duplicates: 0, flagged: 0, error: null };
    try {
      const text = await extractPageText(source.url);

      const prompt = `You are a data-extraction engine. The following is raw text scraped from a scholarship listing page ("${source.name}"). Today's date is ${today}.

Extract EVERY distinct scholarship or funded program you can identify. Rules:
- Only real scholarships/programs — skip navigation junk, ads, and category labels.
- deadline: exactly as stated; empty string if the text doesn't state one.
- likelyOutdated: true if the deadline is before ${today} or it references a past intake year.
- confidence "low" when you had to guess key fields.
- link: the [url] that appears right after the scholarship's name, if any.

RAW PAGE TEXT:
${text}`;

      const { scholarships } = await generateJSON(prompt, parseSchema);
      entry.found = scholarships.length;

      // Existing titles from this source, for the fuzzy dedupe pass.
      const existingTitles = await Scholarship.find({ source: source.name })
        .select("title")
        .lean();

      for (const s of scholarships) {
        const fingerprint = fingerprintOf(s);
        if (fingerprint.length < 5) continue; // garbage guard

        // DEDUPE (spec): same title+provider+deadline → refresh, don't duplicate.
        const existing = await Scholarship.findOne({ fingerprint });
        if (existing) {
          existing.scrapedAt = new Date();
          await existing.save();
          entry.duplicates += 1;
          continue;
        }

        // Fuzzy fallback: paraphrased duplicate of something we already have?
        if (existingTitles.some((e) => isSameScholarship(e.title, s.title))) {
          entry.duplicates += 1;
          continue;
        }

        const flagged = s.likelyOutdated || s.confidence === "low";
        await Scholarship.create({
          ...s,
          aiConfidence: s.confidence,
          source: source.name,
          fingerprint,
          // Clean entries go live immediately; flagged ones need an admin (FR #2).
          status: flagged ? "pending" : "approved",
        });
        entry.added += 1;
        if (flagged) entry.flagged += 1;
        existingTitles.push({ title: s.title }); // catch within-run paraphrases too
      }
    } catch (err) {
      entry.error = err.message;
    }
    report.push(entry);
  }

  return report;
}
