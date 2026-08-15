# Supervisor Email Composer (Module 3)

The last unbuilt feature in the spec, now shipped. Owned by **Member 2
(Audity)** per the original split.

**What it does:** a student picks one of three templates, fills in the
specifics (professor, university, the paper they actually read, intake), and
gets a ready-to-send subject and body — with their own name, degree, CGPA,
research interest and English score merged in from their saved profile.

**Files:**
`server/src/data/emailTemplates.js` · `server/src/controllers/tools.controller.js`
(`listEmailTemplates`, `composeEmail`) · `server/src/routes/tools.routes.js` ·
`client/src/pages/EmailComposer.jsx`

## Flow

1. `GET /api/tools/email-templates` fills the template picker (id, name, description only —
   the bodies stay on the server).
2. The student fills the form. Fields adapt to the template: the paper title
   only shows for the PhD inquiry, the professor name hides for the
   department-wide Master's enquiry.
3. `POST /api/tools/compose-email` merges:
   - **from the form** — professorName, university, paperTitle, program, degreeLevel, intake
   - **from `req.user`** — studentName, email, degree, cgpa, researchInterest
   - **derived** — `englishLine`, which states the real IELTS/TOEFL score, or
     says a test is still being prepared when none is on file
4. The merge is one line: `text.replace(/\{\{(\w+)\}\}/g, (m, key) => values[key] ?? m)`.
   Anything with no value is **left in braces on purpose** and reported in a
   `missing` array, so the UI can warn instead of silently sending a blank.
5. The response includes a prebuilt `mailto:` URL; the page also offers copy-all.

## Why it's rule-based (no AI)

The spec calls for a mail merge, and there's a real reason beyond the spec: a
professor can tell a generated email from an edited one, and a student has to
be able to defend every sentence they sent. Gemini is used elsewhere in the
platform where generation genuinely helps — here a template the student edits
is the better product.

## Viva Q&A

- *Where do the placeholder values come from?* Three sources — the form, the
  authenticated user's profile, and one derived line (English test). The
  server never trusts the client for name/CGPA; it reads `req.user`.
- *What happens to placeholders you can't fill?* They stay as `{{key}}` and
  come back in `missing[]`. The UI shows an amber warning listing them. Failing
  loudly beats sending "Dear Professor ,".
- *Why is the template body not sent to the client in the list call?* The
  picker only needs id/name/description; keeping bodies server-side means the
  merge happens in exactly one place.
- *How does it handle a student with no English test?* The `englishLine`
  branch writes an honest sentence about preparing for the test rather than
  omitting it — silence there reads as evasion to an admissions reader.

## Practice modifications

- Easy: add a fourth template (append to `emailTemplates.js` — no other file changes).
- Medium: add a `{{cityOfOrigin}}` placeholder sourced from the profile.
- Hard: save composed drafts per student so they can revisit and edit them
  (new model + list/detail endpoints, mirroring the favourites pattern).
