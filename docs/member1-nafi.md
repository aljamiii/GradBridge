# Member 1 — Abdullah Sajid Nafi

Features: **AI Cost Predictor** (Module 1) · **AI Destination Advisor / RAG**
(Module 2) · **Life Compatibility Score** + **Financial Risk & Savings Planner**
(Module 3). External APIs used: Gemini, open.er-api.com, OpenWeather.

---

## 1. AI Budget & Cost Predictor (Module 1)

**What it does:** country + city + lifestyle → realistic first-year cost
breakdown in USD, converted to BDT with a live exchange rate, compared against
the student's saved budget.

**Files:** `server/src/controllers/ai.controller.js` (`predictCost`) ·
`server/src/services/gemini.js` · `server/src/services/exchangeRate.js` ·
`server/src/routes/ai.routes.js` · `client/src/pages/CostPredictor.jsx`

**Flow:**
1. Page POSTs `{country, city, lifestyle}` to `/api/ai/cost-predictor`.
2. Controller checks the cache (`Map`, key `country|city|lifestyle`, TTL 24h) —
   the spec requires per-request caching to save API calls.
3. On miss: `Promise.all` runs **two calls in parallel** — Gemini (JSON mode
   with `costSchema`: tuition, visa, flight, insurance, deposit, monthlyLiving,
   currencyLocal, notes) and the exchange-rate service (USD rates, cached 12h).
4. Controller computes `totalUSD` (sum + monthly×12) and `totalBDT = totalUSD × rates.BDT`.
5. Page renders the table; if `user.studentProfile.budgetUSD` exists it shows a
   green "covered" / amber "short by $X" verdict.

**Why it's built this way:**
- JSON schema instead of parsing prose → the AI cannot reply in a format we
  can't render.
- Totals are computed in **our code**, not by the AI → arithmetic is guaranteed
  correct; the AI only estimates the line items.
- `Promise.all` → latency of the slower call, not the sum of both.

**Viva Q&A:**
- *Where does the BDT number come from — the AI?* No. AI gives USD line items;
  we multiply by the live rate from open.er-api.com (free, no key, cached 12h).
- *What if the same student asks twice?* Cache hit — response includes
  `cached: true`, the UI shows a ⚡ badge. No Gemini quota spent.
- *Can the AI numbers be wrong?* Yes — they're estimates; UI says "verify on the
  university's website". The disclaimer is deliberate product design.

**Practice modifications:**
- Easy: add a fourth lifestyle option `"luxury"` (controller validation list +
  `LIFESTYLES` array in the page).
- Medium: add `booksAndSupplies` to the schema, the total, and the table.
- Medium: change cache TTL to 1h and explain the trade-off.

---

## 2. AI Destination Advisor — RAG (Module 2)

**What it does:** free-form questions about living in a city; answers come from
OUR curated knowledge base + live weather, not the model's memory. Refuses
questions the KB doesn't cover.

**Files:** `ai.controller.js` (`askDestinationAdvisor`) · `services/gemini.js`
(`embedText`) · `services/weather.js` · `models/KnowledgeChunk.js` ·
`data/knowledgeBase.js` (24 chunks: 6 cities × 4 topics) ·
`scripts/seedKnowledge.js` · `scripts/createVectorIndex.js` ·
`client/src/pages/DestinationAdvisor.jsx`

**The RAG loop (memorize the four verbs):**
1. **EMBED** — the question becomes a 768-dim vector via `gemini-embedding-001`.
2. **RETRIEVE** — **Atlas Vector Search** (`$vectorSearch` aggregation): the
   DB's vector index returns the nearest chunks; keep top-4 with cosine ≥ 0.45.
   If the index is missing (or on non-Atlas Mongo) it automatically falls back
   to the original in-memory cosine scan — the JSON response's `retrieval`
   field names which path ran.
3. **AUGMENT** — retrieved chunks + live OpenWeather for the top chunk's city
   are pasted into the prompt as CONTEXT.
4. **GENERATE** — `gemini-2.5-flash` answers with the rule: *use ONLY the
   context; if it's not there, say the guide doesn't cover it.*

**Why it's built this way:**
- Embeddings put similar *meanings* close together — "is halal food available"
  matches the food chunk even with zero shared keywords.
- Retrieval is a **DB query, not an app loop**: Atlas Vector Search scales past
  a few dozen chunks and is how production RAG systems retrieve. The in-app
  cosine scan is kept as an automatic fail-soft fallback — and as the
  whiteboard explanation of what the index computes.
- Weather is **fail-soft** (null on error) — a weather outage must not kill answers.
- The UI shows **source chips with similarity %** — proof of retrieval, and your
  best demo moment: ask about Toronto (grounded answer) then Tokyo (refusal).

**Viva Q&A:**
- *Why RAG here but plain Gemini for the cost predictor?* Costs are stable,
  widely-published knowledge; local living detail (mosques, community) is niche
  and changeable — grounding prevents hallucination. RAG needs a curated KB,
  which is worth it for a few dozen city guides.
- *What is cosine similarity?* The cosine of the angle between two vectors —
  1 = same direction/meaning, 0 = unrelated. Formula: dot(a,b)/(|a||b|) — it's
  ~10 lines in the controller, be ready to point at it.
- *How do you add a city?* Append entries to `knowledgeBase.js`, run
  `node src/scripts/seedKnowledge.js` (wipes + re-embeds + stores).
- *Why threshold 0.45?* Below that, chunks are topically unrelated; feeding them
  in would invite the model to improvise. Tuned empirically.
- *How does `$vectorSearch` work here?* One-time index (`createVectorIndex.js`:
  768 dims, cosine) on the `embedding` field; the query hands Gemini's question
  vector to the index, which returns the nearest chunks with a score. Atlas
  normalizes cosine to `(1+cos)/2`, so the controller converts back
  (`score*2-1`) before applying the same 0.45 threshold — the UI's similarity
  chips are unchanged.

**Practice modifications:**
- Easy: add a 5th suggested question chip in the page.
- Medium: change TOP_K to 6 and explain the precision/recall trade-off.
- Hard: add a "monthly-costs" topic chunk for one city and re-seed, then ask
  about it live.

---

## 3. Life Compatibility Score (Module 3) — deliberately NO AI

**What it does:** student sets 0–10 priority sliders (budget, weather,
community, safety) → every destination gets a transparent weighted-sum score +
a template verdict ("Strong on budget, weak on weather").

**Files:** `controllers/tools.controller.js` (`computeCompatibility`) ·
`data/destinations.js` (10 city profiles, 0–100 per attribute) ·
`routes/tools.routes.js` · `client/src/pages/Compatibility.jsx`

**The formula (be able to compute one by hand):**
`score = Σ(componentScore × weight) / Σ(weights)`
Weather component respects the saved profile preference: prefer-warm → use
`warmth`; prefer-cold → `100 − warmth`; no preference → neutral 70.
Verdict = best/weakest among components the student weighted ≥ 3.

Worked example (KL, weights 7/5/8/6, prefer-warm):
(95×7 + 100×5 + 100×8 + 75×6) / 26 = 2415/26 ≈ **93**.

**Viva Q&A:**
- *Why no AI?* The spec demands a weighted-sum formula — and a formula is
  explainable, reproducible, and instant. AI would add cost and randomness to
  something arithmetic does better. (Strong answer — examiners like this.)
- *Where do the destination numbers come from?* Editorial profiles in
  `destinations.js` (planned migration into MongoDB so admins can edit).
- *Why divide by Σweights?* Normalizes to 0–100 regardless of how many sliders
  the student raises.

**Practice modifications:**
- Easy: add a destination to `destinations.js`.
- Medium: add a 5th component (e.g., "jobs") end to end: data field, weights,
  slider, breakdown bar.

---

## 4. Financial Risk & Savings Planner (Module 3) — pure arithmetic

**What it does:** cost vs (funding + scholarship) → shortfall, threshold-based
risk level, required monthly savings until a deadline, scholarship coverage %,
all mirrored in BDT.

**Files:** `tools.controller.js` (`analyzeFinancialRisk`) ·
`services/exchangeRate.js` · `client/src/pages/FinancialRisk.jsx`

**The rules (threshold table — quote it):**
| shortfall / cost | risk |
|---|---|
| 0 | safe |
| ≤ 15% | low |
| ≤ 35% | medium |
| > 35% | high |

`monthlySavings = ceil(shortfall / monthsLeft)`, months from
`(deadline − now) / 30.44 days` (average month length), minimum 1.

**Viva Q&A:**
- *Why thresholds and not AI?* Spec says "risk level by threshold rules; pure
  arithmetic + ExchangeRate API". Also: financial advice must be reproducible.
- *Why 30.44?* 365.25/12 — average Gregorian month; avoids month-boundary bugs.
- *Why `Math.ceil` on savings?* Rounding down would leave the student short at
  the deadline — always round the required amount up.

**Practice modifications:**
- Easy: change the "high" threshold to 40%.
- Medium: add a "partTimeIncomeUSD" monthly input that reduces the required
  savings, with a cap note (visa hour limits).
