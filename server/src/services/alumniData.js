// SERVICE: structured alumni admission records (Module 3 — Success Path).
// Spec source is Google Sheets: publish any sheet to the web as CSV and set
// GOOGLE_SHEET_CSV_URL in .env — no API key needed. Until then we ship a
// bundled CSV with the exact same columns, so swapping in the live sheet
// is a config change, not a code change.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOCAL_CSV = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data/alumni.csv"
);

let cache = null; // { records, expires }
const TTL_MS = 60 * 60 * 1000; // re-read the sheet hourly

// Minimal CSV parser — our columns never contain commas.
const parseCSV = (text) => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines.map((line) => {
    const cells = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return {
      year: Number(row.year),
      field: row.field,
      cgpa: Number(row.cgpa),
      ielts: Number(row.ielts),
      country: row.country,
      university: row.university,
      program: row.program,
      funding: row.funding, // full | partial | self | none
      outcome: row.outcome, // admitted | rejected
    };
  });
};

export async function getAlumniRecords() {
  if (cache && cache.expires > Date.now()) return cache.records;

  let text;
  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;
  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`Sheet responded ${res.status}`);
      text = await res.text();
    } catch {
      text = await readFile(LOCAL_CSV, "utf8"); // sheet down → bundled data
    }
  } else {
    text = await readFile(LOCAL_CSV, "utf8");
  }

  const records = parseCSV(text).filter((r) => r.cgpa > 0 && r.outcome);
  cache = { records, expires: Date.now() + TTL_MS };
  return records;
}
