// SERVICE: the Self-Updating Scholarship Aggregator pipeline.
//
// 1. FETCH each source page
// 2. EXTRACT readable text with Cheerio
// 3. PARSE raw text with Gemini
// 4. CHECK duplicate scholarships
// 5. SAVE possible duplicates into DuplicateCandidate
// 6. SAVE new scholarships into Scholarship

import * as cheerio from "cheerio";

import Scholarship from "../models/Scholarship.js";
import DuplicateCandidate from "../models/DuplicateCandidate.js";

import { generateJSON } from "./gemini.js";


// ============================================================
// SOURCES
// ============================================================

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


// ============================================================
// GEMINI RESPONSE SCHEMA
// ============================================================

const parseSchema = {
  type: "object",

  properties: {
    scholarships: {
      type: "array",

      items: {
        type: "object",

        properties: {
          title: {
            type: "string",
          },

          provider: {
            type: "string",
            description:
              "university or organization offering it",
          },

          country: {
            type: "string",
            description:
              "study destination country; 'Multiple' if several",
          },

          degreeLevels: {
            type: "array",

            items: {
              type: "string",

              enum: [
                "Bachelors",
                "Masters",
                "PhD",
              ],
            },
          },

          deadline: {
            type: "string",
            description:
              "as stated, e.g. '15 October 2026'; empty if not stated",
          },

          fundingType: {
            type: "string",

            enum: [
              "full",
              "partial",
              "varies",
              "unknown",
            ],
          },

          eligibility: {
            type: "string",
            description:
              "1-2 sentence eligibility summary",
          },

          link: {
            type: "string",
            description:
              "the URL for this scholarship if present in the text",
          },

          confidence: {
            type: "string",

            enum: [
              "high",
              "medium",
              "low",
            ],

            description:
              "low if key fields were guessed or text was ambiguous",
          },

          likelyOutdated: {
            type: "boolean",

            description:
              "true if deadline is in the past or refers to a previous intake year",
          },

          flagReason: {
            type: "string",
            description:
              "reason when likelyOutdated is true or confidence is low",
          },
        },

        required: [
          "title",
          "provider",
          "country",
          "degreeLevels",
          "deadline",
          "fundingType",
          "eligibility",
          "confidence",
          "likelyOutdated",
        ],
      },
    },
  },

  required: [
    "scholarships",
  ],
};


// ============================================================
// FETCH PAGE + EXTRACT READABLE TEXT
// ============================================================

async function extractPageText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) GradBridge-EduBot/1.0",
    },

    signal:
      AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(
      `${url} responded ${response.status}`
    );
  }

  const html =
    await response.text();

  const $ =
    cheerio.load(html);

  // Remove unnecessary webpage elements.
  $(
    "script, style, nav, footer, header, form, iframe"
  ).remove();


  // Keep full URLs beside link text.
  $("a[href]").each(
    (_, element) => {
      const href =
        $(element).attr("href");

      const text =
        $(element)
          .text()
          .trim();

      if (
        text &&
        href?.startsWith("http")
      ) {
        $(element).replaceWith(
          `${text} [${href}]`
        );
      }
    }
  );


  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}


// ============================================================
// EXISTING FINGERPRINT
// ============================================================
//
// We are keeping this because your current Scholarship model
// already requires fingerprint.
//
// The NEW duplicate-review feature below does not rely on it.

const fingerprintOf = (scholarship) =>
  [
    scholarship.title,
    scholarship.provider,
    scholarship.deadline,
  ]
    .map((value) =>
      (value ?? "")
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ""
        )
    )
    .join("|");


// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (value) =>
  (value ?? "")
    .toLowerCase()
    .trim()
    .replace(
      /\s+/g,
      " "
    );


// ============================================================
// EXACT DUPLICATE CHECK
// ============================================================
//
// Exact duplicate:
//
// same title
// same provider
// same deadline

const isExactDuplicate = (
  existing,
  incoming
) => {
  return (
    normalizeText(
      existing.title
    ) ===
      normalizeText(
        incoming.title
      ) &&

    normalizeText(
      existing.provider
    ) ===
      normalizeText(
        incoming.provider
      ) &&

    normalizeText(
      existing.deadline
    ) ===
      normalizeText(
        incoming.deadline
      )
  );
};


// ============================================================
// TITLE TOKENS
// ============================================================

const titleTokens = (title) =>
  new Set(
    (title ?? "")
      .toLowerCase()
      .split(
        /[^a-z0-9]+/
      )
      .filter(
        (word) =>
          word.length >= 3 &&
          ![
            "the",
            "for",
            "and",
          ].includes(word)
      )
  );


// ============================================================
// FUZZY TITLE SIMILARITY
// ============================================================
//
// Jaccard similarity.
//
// 1.00 = same words
// 0.80 = very similar
// 0.60 = possible duplicate
// below 0.60 = treated as different

const titleSimilarity = (
  titleA,
  titleB
) => {
  const a =
    titleTokens(titleA);

  const b =
    titleTokens(titleB);


  if (
    a.size === 0 ||
    b.size === 0
  ) {
    return 0;
  }


  let shared = 0;


  for (const word of a) {
    if (b.has(word)) {
      shared += 1;
    }
  }


  const unionSize =
    a.size +
    b.size -
    shared;


  if (unionSize === 0) {
    return 0;
  }


  return (
    shared /
    unionSize
  );
};


// ============================================================
// SAVE DUPLICATE CANDIDATE
// ============================================================

async function saveDuplicateCandidate({
  originalScholarship,
  incomingScholarship,
  sourceName,
  similarityScore,
  matchType,
}) {

  // Prevent the same pending duplicate from being saved
  // repeatedly every time the scraper runs.

  const alreadyExists =
    await DuplicateCandidate.findOne({
      originalScholarship:
        originalScholarship._id,

      "candidateData.title":
        incomingScholarship.title,

      "candidateData.provider":
        incomingScholarship.provider,

      "candidateData.deadline":
        incomingScholarship.deadline,

      status:
        "pending",
    });


  if (alreadyExists) {
    return;
  }


  await DuplicateCandidate.create({
    originalScholarship:
      originalScholarship._id,


    candidateData: {
      title:
        incomingScholarship.title ||
        "",

      provider:
        incomingScholarship.provider ||
        "",

      country:
        incomingScholarship.country ||
        "",

      degreeLevels:
        incomingScholarship.degreeLevels ||
        [],

      deadline:
        incomingScholarship.deadline ||
        "",

      fundingType:
        incomingScholarship.fundingType ||
        "unknown",

      eligibility:
        incomingScholarship.eligibility ||
        "",

      link:
        incomingScholarship.link ||
        "",

      source:
        sourceName,

      aiConfidence:
        incomingScholarship.confidence ||
        "medium",

      likelyOutdated:
        Boolean(
          incomingScholarship.likelyOutdated
        ),

      flagReason:
        incomingScholarship.flagReason ||
        "",
    },


    similarityScore,

    matchType,

    status:
      "pending",

    detectedAt:
      new Date(),
  });
}


// ============================================================
// MAIN SCRAPER
// ============================================================

export async function runScraper() {

  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  const report = [];


  // Process every scholarship source.
  for (const source of SOURCES) {

    const entry = {
      source:
        source.name,

      found:
        0,

      added:
        0,

      duplicates:
        0,

      flagged:
        0,

      error:
        null,
    };


    try {

      // ======================================================
      // STEP 1: FETCH SOURCE PAGE
      // ======================================================

      const text =
        await extractPageText(
          source.url
        );


      // ======================================================
      // STEP 2: PARSE PAGE USING GEMINI
      // ======================================================

      const prompt = `
You are a data-extraction engine.

The following is raw text scraped from a scholarship listing page:

"${source.name}"

Today's date is ${today}.

Extract EVERY distinct scholarship or funded program you can identify.

Rules:

- Only real scholarships/programs.
- Skip navigation junk, advertisements and category labels.
- deadline: exactly as stated.
- If no deadline is stated, return an empty string.
- likelyOutdated: true if the deadline is before ${today}
  or it refers to a past intake year.
- confidence must be "low" if important fields had to be guessed.
- link: use the [url] appearing beside the scholarship name if available.

RAW PAGE TEXT:

${text}
`;


      const result =
        await generateJSON(
          prompt,
          parseSchema
        );


      const scholarships =
        Array.isArray(
          result.scholarships
        )
          ? result.scholarships
          : [];


      entry.found =
        scholarships.length;


      // ======================================================
      // STEP 3: LOAD EXISTING SCHOLARSHIPS FROM THIS SOURCE
      // ======================================================

      const existingScholarships =
        await Scholarship.find({
          source:
            source.name,
        });


      // ======================================================
      // STEP 4: PROCESS EACH SCRAPED SCHOLARSHIP
      // ======================================================

      for (
        const incoming
        of scholarships
      ) {

        // Ignore garbage entries.
        if (
          !incoming.title ||
          incoming.title.trim().length <
            3
        ) {
          continue;
        }


        // We still create fingerprint because Scholarship.js
        // currently requires it.
        const fingerprint =
          fingerprintOf(
            incoming
          );


        if (
          fingerprint.length <
          5
        ) {
          continue;
        }


        // ====================================================
        // EXACT DUPLICATE
        // ====================================================

        const exactMatch =
          existingScholarships.find(
            (existing) =>
              isExactDuplicate(
                existing,
                incoming
              )
          );


        if (exactMatch) {

          // Refresh last-seen timestamp.
          exactMatch.scrapedAt =
            new Date();

          await exactMatch.save();


          // Store the incoming duplicate for admin review.
          await saveDuplicateCandidate({
            originalScholarship:
              exactMatch,

            incomingScholarship:
              incoming,

            sourceName:
              source.name,

            similarityScore:
              1,

            matchType:
              "exact",
          });


          entry.duplicates +=
            1;


          continue;
        }


        // ====================================================
        // FUZZY DUPLICATE
        // ====================================================

        let fuzzyMatch =
          null;

        let highestSimilarity =
          0;


        for (
          const existing
          of existingScholarships
        ) {

          const similarity =
            titleSimilarity(
              existing.title,
              incoming.title
            );


          if (
            similarity >=
              0.6 &&
            similarity >
              highestSimilarity
          ) {

            highestSimilarity =
              similarity;

            fuzzyMatch =
              existing;
          }
        }


        if (fuzzyMatch) {

          await saveDuplicateCandidate({
            originalScholarship:
              fuzzyMatch,

            incomingScholarship:
              incoming,

            sourceName:
              source.name,

            similarityScore:
              highestSimilarity,

            matchType:
              "fuzzy",
          });


          entry.duplicates +=
            1;


          continue;
        }


        // ====================================================
        // NEW SCHOLARSHIP
        // ====================================================

        const flagged =
          incoming.likelyOutdated ||
          incoming.confidence ===
            "low";


        const createdScholarship =
          await Scholarship.create({

            title:
              incoming.title,


            provider:
              incoming.provider ||
              "",


            country:
              incoming.country ||
              "",


            degreeLevels:
              incoming.degreeLevels ||
              [],


            deadline:
              incoming.deadline ||
              "",


            fundingType:
              incoming.fundingType ||
              "unknown",


            eligibility:
              incoming.eligibility ||
              "",


            link:
              incoming.link ||
              "",


            source:
              source.name,


            fingerprint,


            aiConfidence:
              incoming.confidence ||
              "medium",


            likelyOutdated:
              Boolean(
                incoming.likelyOutdated
              ),


            flagReason:
              incoming.flagReason ||
              "",


            scrapedAt:
              new Date(),


            status:
              flagged
                ? "pending"
                : "approved",
          });


        entry.added +=
          1;


        if (flagged) {
          entry.flagged +=
            1;
        }


        // Important:
        // Add newly created scholarship to memory.
        // This lets us detect duplicates that appear later
        // during the SAME scraper run.

        existingScholarships.push(
          createdScholarship
        );
      }
    } catch (error) {

      entry.error =
        error.message;
    }


    report.push(
      entry
    );
  }


  return report;
}