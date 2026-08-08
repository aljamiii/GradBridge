# Member 3 — K. M. Muhaiminul Islam

Features: **Bangladeshi Abroad Network Map** (Module 1) · **Real-Time Mentor &
Ambassador Chat with Alerts** (Module 2) · **Rule-Based Mentor Matcher &
Booking** + **Community Forum & Insights Dashboard** (Module 3).
External APIs: OpenStreetMap Nominatim (geocoding) + OSM tiles.

---

## 1. Bangladeshi Abroad Network Map (Module 1)

**What it does:** students already abroad opt in from their profile; they're
geocoded and plotted on an interactive world map, filterable by country,
degree, and subject.

**Files:** `models/User.js` (`studentProfile.abroad` + 2dsphere index) ·
`services/geocode.js` (Nominatim) · `controllers/user.controller.js`
(`updateProfile` geocoding hook + `getNetworkMap` + `getNearbyStudents`) ·
`client/src/pages/NetworkMap.jsx` (Leaflet) · `scripts/seedAbroadStudents.js` ·
`scripts/backfillGeoPoints.js`

**Flow:**
1. Profile page has an opt-in checkbox + city/country/university/degree/subject.
2. On save, IF the location changed (or was never geocoded), the server calls
   **Nominatim** (`geocodePlace`): try "university, city, country" first, fall
   back to "city, country". Results cached per query; identified User-Agent;
   fail-soft (profile still saves; the pin just waits).
3. `GET /api/users/network-map` returns only `abroad.optIn: true` users with
   coordinates — privacy by default.
4. Leaflet renders OSM tiles + a `divIcon` pin per student; filters run
   client-side over the fetched pins; `fitBounds` re-zooms to the filtered set.
5. **Cross-link:** each pin popup has "🧭 Explore this area →" deep-linking to
   `/survival-guide?q=<university, city, country>` (popup content is a DOM
   element, not an HTML string, so the link navigates inside the SPA). The map
   also reads `?country=` to open pre-filtered — that's where the Survival
   Guide's "see them on the Network Map" chip lands. Two map features, two
   halves of one journey: find your people, then learn their neighbourhood.
6. **Geospatial endpoint (mine):** `GET /api/users/network-map/nearby?lat=&lng=`
   powers that chip. `abroad.lat/lng` is mirrored into a GeoJSON `Point`
   (`location`, **[lng, lat] order** — the classic gotcha) with a **2dsphere
   index**; a `$geoNear` aggregation (must be the *first* pipeline stage)
   returns opted-in students within the radius, already distance-sorted and
   excluding the caller. Same philosophy as my forum insights: **make the
   database do the work** — no JS haversine loop over every pin.

**Why:**
- Google Maps now requires a credit card; Leaflet + OSM + Nominatim delivers
  the same feature at $0 — an engineering trade-off, name it proudly.
- Geocoding server-side on SAVE (not on every map view): one geocode per
  profile change instead of N per page load; respects Nominatim's ~1 req/s policy.
- `divIcon` (a styled div) instead of Leaflet's default marker images — those
  break under bundlers like Vite.

**Viva Q&A:**
- *How do you protect privacy?* Only opted-in students are ever queried
  (`optIn: true` is in the DB filter, not client-side hiding).
- *What if Nominatim can't find the university?* Fallback query city+country;
  if that fails too → coords null → not plotted, profile intact (fail-soft).
- *Why filter client-side?* Dozens of pins — refetching per filter would be
  wasteful; the data is already in memory.
- *How does the "students near this campus" chip know who's nearby?* It calls
  MY endpoint: `$geoNear` on the 2dsphere index over `abroad.location`. The
  DB computes great-circle distances from the index and returns sorted
  results — the Survival Guide page just renders the count.
- *Why store both lat/lng and a GeoJSON Point?* lat/lng feeds Leaflet
  directly; the Point feeds the index. They're kept in sync in one place
  (`updateProfile`), and `backfillGeoPoints.js` migrated pre-existing pins
  with a single pipeline-update (`updateMany` + aggregation `$set`).

**Practice modifications:**
- Easy: change the pin color / make PhD pins a different color.
- Medium: add a "university" text filter beside the existing three.
- Hard: cluster pins in the same city with a count badge.

---

## 2. Real-Time Mentor & Ambassador Chat with Alerts (Module 2)

**What it does:** student↔mentor chat with instant delivery, unread badges in
the navbar, and booking events appearing in the thread as system messages.

**Files:** `server/src/socket.js` · `models/Conversation.js` +
`models/Message.js` · `controllers/chat.controller.js` ·
`routes/chat.routes.js` · `client/src/lib/socket.js` ·
`client/src/pages/Chat.jsx` · `vite.config.js` (`/socket.io` ws proxy)

**Architecture — quote this line: REST for state, sockets for events.**
- REST: inbox (`GET /api/chat`), history (`GET /api/chat/:id/messages`, which
  also marks messages read), unread count.
- Socket.io: `io.use()` middleware verifies the JWT from the handshake — no
  token, no connection. Every user joins a personal room `user:<id>`; opening a
  thread joins `convo:<id>` (after a membership check).
- Sending: client emits `message:send` → server validates membership → shared
  `deliverMessage()` saves the Message, updates the conversation preview, emits
  `message:new` to the thread room and `inbox:update` to the recipient's
  personal room (that's what refreshes the navbar badge anywhere in the app).
- **System messages**: bookings call `sendSystemMessage()` — the in-app alert
  layer ("📅 Booking request…", "✅ confirmed") without an email dependency.

**Data model decisions:**
- One Conversation per student-mentor pair, enforced by a **unique compound
  index** `(student, mentor)`.
- `Message.unreadFor` holds the user id who hasn't read it; marking read =
  setting it null; unread count = `countDocuments({unreadFor: me})`. Simple
  because chats are exactly two people.

**The bug I fixed (tell this story — it shows ownership):** my own sent
messages appeared twice: once from the send-acknowledgment and once from the
room broadcast (I'm in the room too). Refresh showed one — the DB was right,
the UI state was wrong. Fix: both delivery paths check `_id` before appending
(dedupe by id — standard practice in real-time UIs where one event can arrive
via multiple channels).

**Viva Q&A:**
- *Why do you need Socket.io at all — why not poll?* Polling wastes requests
  and adds latency; WebSockets push instantly over one connection.
- *How is the socket authenticated?* JWT in `socket.handshake.auth.token`,
  verified server-side in `io.use` before any events flow.
- *Can I join a conversation I'm not part of?* No — `convo:join` loads the
  conversation and checks I'm the student or the mentor before `socket.join`.

**Practice modifications:**
- Easy: add a "typing…" event (emit on input, show under the header).
- Medium: add message timestamps grouped by day.
- Hard: mark-read via socket instead of on history load.

---

## 3. Rule-Based Mentor Matcher & Session Booking (Module 3)

**What it does:** approved mentors ranked by tag overlap with the student's
profile; the student books a time slot; a conflict check prevents double
booking; the mentor confirms or declines.

**Files:** `controllers/mentor.controller.js` ·
`controllers/booking.controller.js` · `models/Booking.js` ·
`client/src/pages/Mentors.jsx` + `Bookings.jsx`

**Matching (NO AI — spec requires rule-based tag overlap):** tokenize the
student's `preferredCountry + researchInterest + degree` and each mentor's
`qualification + university + expertise[]` (lowercase, ≥3 letters, stopwords
removed); `matchScore` = count of shared distinct tokens; response includes
`matchedOn` so the UI can show WHY ("matched on: canada") — explainable ranking.

**Conflict check (the interval-overlap rule — write it on the whiteboard):**
```
conflict ⇔ existing.start < newEnd  AND  newStart < existing.end
```
checked against the mentor's pending+confirmed bookings only (declined/
cancelled don't block). Also rejected: past datetimes, unapproved mentors.

**Status rules:** mentors may set confirmed/declined, students only cancelled —
enforced by role in the controller, with ownership in the query filter. Every
transition posts a system message into the chat thread.

**Viva Q&A:**
- *Why not exact-slot matching for conflicts?* A 10:00–10:30 booking and a
  10:15 request overlap without being equal — interval math catches partial
  overlaps.
- *Why is the score explainable?* `matchedOn` lists the overlapping tags —
  a ranked list a human can audit, exactly what "rule-based" means.
- *What stops booking a pending (unapproved) mentor?* The mentor lookup itself
  filters `verificationStatus: "approved"`.

**Practice modifications:**
- Easy: add 45 to the duration enum (model + form select).
- Medium: give expertise-tag matches double weight vs university-word matches.
- Hard: let mentors define weekly availability windows and validate against them.

---

## 4. Community Forum & Insights Dashboard (Module 3)

**What it does:** a real forum (posts, tags, one-per-user upvotes, 1–5 star
ratings, replies) plus an analytics dashboard computed with **MongoDB
aggregation pipelines** — top concerns, avg rating per tag, discussion by city,
seasonal posting trend.

**Files:** `models/Post.js` · `controllers/forum.controller.js` ·
`controllers/insights.controller.js` · `client/src/pages/Forum.jsx` +
`ForumInsights.jsx` · `scripts/seedForum.js`

**Model decisions (be ready to defend each):**
- `upvotes: [userId]` — an array of voter ids, so one user = one vote and a
  second click *toggles* it off. Count = array length.
- `ratings: [{user, stars}]` — one rating per user, updatable in place.
- **Comments embedded** in the post (not a separate collection): a thread is
  always read together with its post — one query, no join. `authorName` is
  denormalized to skip populate on every list.

**The aggregations (`insights.controller.js`) — the spec explicitly says "DB
aggregation", so point at the pipelines, not JS loops:**
- Top concerns: `$unwind: "$tags"` → `$group` count + summed `$size` of
  upvotes/comments → `$sort` → `$limit`.
- Avg rating per tag: double `$unwind` (tags, ratings) → `$group` with `$avg`
  → require ≥2 ratings (one vote isn't a signal).
- Seasonal trend: `$group` by `{$year, $month}` of `createdAt` → posts/month.
Know what `$unwind` does: one document per array element, so a post tagged
`[visa, canada]` counts once for each tag.

**Viva Q&A:**
- *Why aggregation in the DB instead of fetching all posts and counting in JS?*
  The DB scans indexes and returns 8 rows instead of shipping every post over
  the network; it scales and it's what the spec requires.
- *How is double-voting prevented?* The vote array stores WHO voted; the
  controller looks for my id and toggles. State lives in data, not the UI.
- *Where do the charts come from?* Plain divs with computed widths — a
  deliberate zero-dependency choice; single validated accent color, values
  labeled, hover tooltips.

**Practice modifications:**
- Easy: raise the tag limit from 5 to 8 (model validator + note in the form).
- Medium: add a "most upvoted post per city" aggregation (`$sort` + `$first`
  inside `$group`) and a card for it.
- Hard: report/flag button on posts + admin review list (mirror the mentor
  verification pattern).
