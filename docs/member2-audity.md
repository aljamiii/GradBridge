# Member 2 — Audity Biswas

Features: **Scholarship & Program Aggregator** (Module 1) · **AI Eligibility &
Gap Analyzer** (Module 2) · **Program & University Explorer** + **Supervisor
Email Composer** (Module 3). External APIs: Gemini, Hipolabs Universities,
scraped sources (Scholars4Dev, DAAD).

---

## 1. Self-Updating Scholarship & Program Aggregator (Module 1)

**What it does:** a scheduled scraper collects scholarship pages, AI turns the
raw text into clean structured entries, outdated/low-confidence entries get
flagged for admin review, duplicates are detected, students browse only
approved data.

**Files:** `server/src/services/scraper.js` (the whole pipeline) ·
`models/Scholarship.js` · `config/scheduler.js` (node-cron) ·
`controllers/scholarship.controller.js` · `routes/scholarship.routes.js` +
admin routes · `client/src/pages/Scholarships.jsx` + `AdminScholarships.jsx`

**The pipeline (5 steps — memorize):**
1. **FETCH** each source URL; Cheerio parses the HTML.
2. **EXTRACT** readable text: strip `script/style/nav/footer`, inline link URLs
   as `text [url]`, cap at 12,000 chars. *No fragile CSS selectors — the AI does
   the understanding, which is exactly what the spec asks for.*
3. **PARSE** with Gemini JSON mode (`temperature: 0`): every entry gets title,
   provider, country, degreeLevels, deadline, fundingType, eligibility, link,
   `confidence` (high/medium/low) and `likelyOutdated` (deadline before today).
4. **DEDUPE** — two layers: exact fingerprint
   `normalize(title)|normalize(provider)|normalize(deadline)` (unique index in
   Mongo) + fuzzy fallback (Jaccard word-overlap ≥ 0.6 on titles) because the
   AI sometimes rephrases a title between runs.
5. **SAVE** — clean entries `status: "approved"` (live immediately); flagged
   entries `status: "pending"` → admin approves/rejects (FR #2).

Scheduling: `cron.schedule("0 6 * * *")` daily + a manual **Run scraper now**
admin button that returns a per-source report (found/added/dupes/flagged).

**Why it's built this way:**
- `temperature: 0` → deterministic extraction, so re-runs produce identical
  fields and fingerprints actually match.
- Jaccard fallback: |A∩B| / |A∪B| over title words ≥ 3 letters — catches
  "Master's Degree Scholarships" vs "Scholarships for a Master's degree".
- Auto-approve clean entries: admins review the *exceptions*, not everything —
  that's what makes it "self-updating".

**Viva Q&A:**
- *What if a source changes its page layout?* Nothing breaks — we never used
  selectors; the AI reads whatever text is there. Worst case: fewer entries and
  lower confidence, which flags them for review.
- *How is "outdated" detected?* The prompt includes today's date; the AI marks
  entries whose stated deadline is before it (verified working: it flagged five
  2026 deadlines that had passed, each with a reason).
- *Why is the fingerprint a unique Mongo index and not just an app check?*
  Race-safety — even two simultaneous scrapes can't insert the same entry twice.
- *Legal/ethical?* Public listing pages, identified User-Agent, one request per
  source per run, plus caching — polite scraping.

**Practice modifications:**
- Easy: add a third source URL to `SOURCES` and run the scraper.
- Medium: add a `stipendAmount` field: schema in `scraper.js`, model, and the
  student card.
- Medium: change the cron to every 12 hours (`0 */12 * * *`).

---

## 2. AI Eligibility & Gap Analyzer (Module 2)

**What it does:** compares the student's saved academic profile against a
program's typical requirements → verdict (eligible / borderline / not-eligible)
+ each gap with severity and one concrete action + strengths.

**Files:** `ai.controller.js` (`analyzeEligibility`) ·
`client/src/pages/Eligibility.jsx`

**Flow:** page sends `{university, program, degreeLevel}`; controller refuses
if profile lacks degree/CGPA (the analysis would be garbage); builds a prompt
containing the profile (degree, CGPA, IELTS, research interest) and instructs
Gemini to be *honest, not encouraging*; JSON schema forces
verdict/summary/gaps[]/strengths[]. Cache key includes CGPA and IELTS, so
updating the profile invalidates stale verdicts.

**Why:** requirements for well-known programs are stable public knowledge —
plain Gemini works. A future upgrade retrieves REAL requirements from the
aggregator's scraped data when available (RAG-style grounding) and falls back
to general knowledge otherwise — say this if asked "could it hallucinate?"
(yes, that's why there's a verify-officially disclaimer and the upgrade path).

**Viva Q&A:**
- *Why does the button disable when the profile is incomplete?* Defense in both
  layers: UI disables AND the API returns 400 — never trust the client.
- *Why does the cache key include profile values?* New CGPA/IELTS must produce
  a fresh analysis, not yesterday's cached verdict.
- *Where do "typical requirements" come from?* The model's training knowledge —
  admission minimums are widely published and stable year to year.

**Practice modifications:**
- Easy: add "Diploma" to degreeLevel options (page buttons + controller list).
- Medium: add a `estimatedChancePercent` number field to the schema and render it.

---

## 3. Program & University Explorer (Module 3) — the full-CRUD feature

**What it does:** live university search (name and/or country) from the free
Hipolabs API, popular universities ranked first, and favorites with notes —
**Create, Read, Update, Delete** on our own database.

**Files:** `controllers/university.controller.js` ·
`controllers/favorite.controller.js` · `models/Favorite.js` ·
`data/popularUniversities.js` · `client/src/pages/Universities.jsx`

**Search flow:** proxy to `universities.hipolabs.com` → country aliases first
("usa" → "United States" — Hipolabs only knows official names) → reshape messy
fields (`web_pages[0]` → `website`) → country searches float curated popular
names to the top **before** the 50-result cap → 1h cache.

**Favorites CRUD:** every operation is scoped `{ user: req.user._id }` so
students can't touch each other's lists; unique compound index `(user, name)`
prevents saving the same university twice (controller catches Mongo error
code 11000 → friendly message); UPDATE = editing your note (`runValidators`,
500-char cap).

**Viva Q&A:**
- *Why proxy instead of calling Hipolabs from React?* CORS + caching + one
  place to handle that API's quirks (aliases, ranking).
- *Which line makes it impossible to delete someone else's favorite?*
  `findOneAndDelete({ _id, user: req.user._id })` — the ownership condition is
  in the query itself, not an if-statement after.
- *Where does "Popular" come from — the API?* No; Hipolabs has no ranking data,
  so a curated per-country list is merged in and flagged. Config-style data
  aiding a LIVE API result.

**Practice modifications:**
- Easy: raise the results cap from 50 to 80.
- Medium: add a country alias ("deutschland" → "Germany").
- Medium: add a `priority` (1–3 stars) field to Favorite: model, update
  endpoint body, UI control.

---

## 4. Supervisor Email Composer (Module 3) — ⚠️ NOT BUILT YET: your commit opportunity

The guideline requires individual commit history — this feature is intact and
scoped small, ideal for you to implement and commit yourself.

**Spec:** student picks a professor + an email template; the system fills
placeholders (professor name, research interest, paper title) via **rule-based
mail-merge** and opens the student's own mail client through a **mailto:** link.
No AI, no email-sending backend.

**Suggested design (follow the existing patterns):**
1. `server/src/data/emailTemplates.js` — 2–3 templates with `{{placeholders}}`
   (funding inquiry, SOP feedback request, PhD supervision inquiry).
2. `controllers/tools.controller.js` → `composeEmail`: takes
   `{templateId, professorName, university, paperTitle}` + pulls
   `researchInterest`/`degree` from `req.user.studentProfile`; replaces
   placeholders with a simple `template.replace(/{{key}}/g, value)` loop;
   returns `{subject, body}`.
3. Route: `POST /api/tools/compose-email` in `tools.routes.js` (student-only).
4. Page `EmailComposer.jsx`: form → preview pane → button with
   `href={"mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)}`.
5. Add to the Tools menu in `Navbar.jsx` + route in `App.jsx`.

**Viva prep:** know why `encodeURIComponent` is required in mailto links
(spaces/newlines break URLs), and why mail-merge here beats AI (instant, free,
the student's own voice, no hallucinated paper titles).
