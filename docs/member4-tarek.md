# Member 4 — Tarek Hossain

Features: **Housing & Survival Guide** (Module 1) · **AI Visa & Document
Checklist** (Module 2) · **Success Path Explorer** + **Job Market & PR Points
Calculator** (Module 3). External APIs: Overpass (OSM), Gemini, Google Sheets
CSV, Adzuna.

---

## 1. Housing & Survival Guide (Module 1)

**What it does:** type a university → map + distance-sorted lists of nearby
mosques, halal food, hospitals, and transit stops.

**Files:** `services/overpass.js` · `services/geocode.js` (shared) ·
`controllers/survival.controller.js` · `client/src/pages/SurvivalGuide.jsx`

**Flow:**
1. `GET /api/survival-guide?q=University of Toronto` → geocode the campus via
   Nominatim (cached).
2. ONE combined **Overpass QL** query around those coordinates:
   `nwr(around:3000,lat,lng)["amenity"="place_of_worship"]["religion"="muslim"]`
   + `["diet:halal"~"yes|only"]` + hospitals (3 km); stations 1.2 km and bus
   stops 800 m (cities have hundreds of bus stops — only very close ones matter).
3. Categorize by OSM tags, compute **haversine** distance from campus, sort
   ascending (spec: "sorted by distance"), dedupe by name, cap 8 per category.
4. Cache by coordinates rounded to 3 decimals (~110 m) for 24 h, so nearby
   geocode variations share one entry.
5. Leaflet map: campus 🎓 marker + color-coded dots per category + popups.

**Two real bugs fixed here (own them — they're good stories):**
- Overpass returned **406**: it blocks requests without a User-Agent. Fix:
  identify ourselves, and fall back across three public Overpass instances
  because the main one is often overloaded (504).
- **White map with floating dots**: the map container changed height when
  results arrived, and Leaflet doesn't watch resizes — it kept rendering tiles
  for the old size. Fix: fixed-height container + `map.invalidateSize()`
  before `fitBounds`. (The classic Leaflet gotcha — say those two words.)

**Viva Q&A:**
- *What's the haversine formula for?* Great-circle distance between two
  lat/lng points — straight-line km, labeled as such in the UI.
- *Why different radii per category?* Utility: a mosque 3 km away matters; a
  bus stop 3 km away doesn't.
- *What if a city has no data?* OSM coverage varies — empty categories say so
  and suggest asking a country ambassador (honest UX beats fake data).

**Practice modifications:**
- Easy: raise the mosque radius to 5 km.
- Medium: add a "pharmacy" category end-to-end (query line, categorize, UI meta).
- Hard: add walking-time estimate (distance ÷ 5 km/h) to each list row.

---

## 2. AI Visa & Document Checklist (Module 2)

**What it does:** target country + degree level → the correct visa name,
processing time, a categorized document checklist with urgency badges,
Bangladesh-specific tips, and a reminder draft. Checkboxes persist.

**Files:** `ai.controller.js` (`generateVisaChecklist`) ·
`client/src/pages/VisaChecklist.jsx`

**Flow:** prompt fixes nationality = Bangladeshi and demands
Bangladesh-specific documents (police clearance, notarized bank solvency,
sponsor affidavits); JSON schema forces each item into
`{document, category(identity|academic|financial|medical|visa-forms),
details, urgency(start-now|before-applying|after-admission)}` + a
`reminderDraft` with a `{DEADLINE_DATE}` placeholder (the spec's reminder
content — email delivery is a planned cron job). Cache 7 days per
country+level (visa rules move slowly). Checkbox progress is stored in
**localStorage keyed per country** (`gradbridge_visa_canada`), so Canada's
ticks don't pollute Germany's list.

**Viva Q&A:**
- *Why urgency levels?* Sequencing is the real student problem: police
  clearance takes weeks (start-now) while some documents need the admission
  letter first (after-admission).
- *Why localStorage and not the DB?* Personal ephemeral progress; zero backend
  cost. Trade-off: not synced across devices — a fine v1, and localStorage is
  an allowed storage per the guideline.
- *Why cache 7 days when costs cache 24 h?* Match TTL to how fast the
  underlying truth changes.

**Practice modifications:**
- Easy: add a "print checklist" button (`window.print()`).
- Medium: add a `costBDT` field per item to the schema and render it.
- Hard: move checkbox state into the user profile via the existing
  `PUT /api/users/profile`.

---

## 3. Success Path Explorer (Module 3)

**What it does:** structured alumni admission records → filter by YOUR
background (CGPA range, field, country) → acceptance rate, funding
distribution among admits, acceptance by CGPA bucket, per-country patterns,
plus the anonymized records table.

**Files:** `services/alumniData.js` · `data/alumni.csv` (50 records) ·
`controllers/successPath.controller.js` · `client/src/pages/SuccessPath.jsx`

**Data source (spec says Google Sheets):** the service fetches
`GOOGLE_SHEET_CSV_URL` — any Google Sheet published to the web as CSV (File →
Share → Publish to web), **no API key needed** — and falls back to the bundled
CSV with identical columns if unset/unreachable, cached 1 h. So real alumni
data later = a config change. *Action item: actually create and publish the
Sheet before evaluation so the demo pulls from Google live.*

**Stats (plain JS over the filtered rows — the data isn't in Mongo, so DB
aggregation doesn't apply here):** acceptance = admitted/total; funding counts
among admitted only (a rejected student's funding is meaningless); CGPA buckets
2.8–3.2 / 3.2–3.5 / 3.5–3.8 / 3.8–4.0 each with its own rate — the "does my
CGPA stand a chance" chart. Verified against an independent hand computation
(CS + CGPA≥3.4 → 13 records, 10 admits, 77% — both paths agree).

**Viva Q&A:**
- *Why does the CSV parser look hand-written?* Columns never contain commas, so
  `split(",")` is sufficient — a dependency would be overkill. Know its limits.
- *Why funding distribution only among admitted?* The question it answers is
  "IF I get in, how do people pay?" — rejected rows would dilute it.
- *Is 50 records statistically meaningful?* Honest answer: it's seed-scale;
  the UI prints n and a "past ≠ future" disclaimer, and the pipeline is ready
  for the real sheet to grow.

**Practice modifications:**
- Easy: add 5 rows to the CSV and watch every chart shift.
- Medium: add an IELTS-range filter (backend param + inputs).
- Medium: bucket acceptance by IELTS instead of CGPA.

---

## 4. Job Market & PR Points Calculator (Module 3)

**What it does:** live job counts + mean advertised salary by field/country
(Adzuna), and a rule-based PR points estimator modeled on the real **Canada
Express Entry CRS** and **Australia 189** systems with per-factor breakdowns.

**Files:** `services/adzuna.js` · `services/prPoints.js` ·
`tools.controller.js` (job-market + pr-points endpoints) ·
`client/src/pages/JobMarketPR.jsx`

**Adzuna:** country→code map (only its 8 covered countries are offered — no
Sweden/Malaysia); `raw.count` = open positions; `raw.mean` = average advertised
salary across ALL matching ads (better than averaging our 5-sample); 12 h
cache; graceful 503 with instructions if keys are missing. **Gotcha we hit:**
Adzuna 400s on unknown query params — send exactly what its docs list.

**PR engine (`prPoints.js`) — pure rule tables, every factor returns
`{factor, points, max}` so the UI can draw an explainable breakdown:**
- Canada (simplified core CRS): age table (peak 110 at 20–29, declining after),
  education (bachelors 120 / masters 135 / phd 150), language via **IELTS→CLB
  mapping** (7.0→CLB9→124 pts), plus education×language and experience×language
  transferability. Verdict vs recent draw cutoffs (~490+ strong / 430+ close
  via PNP / below).
- Australia 189: age (25–32 → 30 pts max), English (IELTS 8→20, 7→10, 6→0 but
  mandatory), overseas experience (3-4y→5, 5-7→10, 8+→15), education (PhD 20,
  Masters/Bachelors 15) — **pass mark 65**, with the regional 491 (+15) hint
  when close.
- Worked example to memorize: age 24 + Master's + 2 yrs + IELTS 7 → Canada
  110+135+124+50+25 = **444** ("close": PNP could bridge).

**Viva Q&A:**
- *Why rules and not AI?* The real immigration systems ARE points tables —
  copying their structure is more accurate than asking a model, and every
  number is auditable ("simplified" is labeled honestly).
- *What's CLB?* Canadian Language Benchmark — Canada scores language in CLB;
  we map overall IELTS approximately (7.0 ≈ CLB 9).
- *Salary looks high/low?* It's the mean of advertised salaries for that query
  — seniors inflate it; labeled "advertised" for that reason.

**Practice modifications:**
- Easy: change the Australia pass-mark hint to also mention state nomination
  (190, +5).
- Medium: add a "studied in Canada" checkbox worth +30 (the real CRS Canadian
  study bonus).
- Medium: show salary converted to BDT using the existing exchangeRate service.
