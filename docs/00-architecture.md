# GradBridge — Architecture Primer (read this first, every member)

Every feature follows the same skeleton. If you understand this file, you can
explain 70% of any feature before even opening its code.

## The stack

| Layer | Tech | Where |
|---|---|---|
| Frontend (the V in MVC) | React 19 + Vite + Tailwind v4 | `client/` |
| Backend API | Node.js + Express 5 | `server/` |
| Database | MongoDB Atlas (cloud, free M0) via Mongoose | models in `server/src/models/` |
| Real-time | Socket.io (shares the HTTP server) | `server/src/socket.js` |
| AI | Google Gemini (`gemini-2.5-flash` + `gemini-embedding-001`) | `server/src/services/gemini.js` |

## MVC in this project

```
Request → route (URL wiring) → middleware (auth) → CONTROLLER (logic)
        → MODEL (Mongoose schema = data shape) → JSON response → React page
```

- **Model** (`src/models/Thing.js`): schema + validation + indexes. Example:
  `User.js` hashes passwords in a `pre("save")` hook using bcrypt.
- **Controller** (`src/controllers/thing.controller.js`): reads `req`, does the
  work, sends `res.json(...)`. Errors go to `next(err)` → `middleware/errorHandler.js`
  so every error response has the same shape.
- **Routes** (`src/routes/thing.routes.js`): map URLs to controllers, apply
  auth middleware. Mounted in `src/app.js` (e.g. `app.use("/api/forum", forumRoutes)`).
- The **View** is the React app — the server returns JSON, never HTML.

## Authentication & roles (common workflow — not a gradeable feature, but you WILL be asked)

1. Register/login → server signs a **JWT** containing only the user id
   (`auth.controller.js`), client stores it in `localStorage`.
2. Every protected request sends `Authorization: Bearer <token>`.
3. `middleware/auth.js` → `protect` verifies the token and loads the user from
   the DB onto `req.user`; `authorize("admin")` then checks `req.user.role`.
4. Frontend mirror: `ProtectedRoute` component redirects by login state and role —
   but that's UX only; **the backend check is the real security**.

Key answers:
- *Why JWT and not sessions?* Stateless — no session store; any server instance
  can verify the token with just the secret. Fits REST APIs.
- *Why is `password` `select: false` in the User model?* So queries never leak
  the hash by default; login explicitly opts in with `.select("+password")`.
- *Why can't anyone register as admin?* `auth.controller.js` forces
  `safeRole = student|mentor`; admins are created by `scripts/seedAdmin.js` only.

## The service layer (`server/src/services/`)

Anything that talks to the outside world lives in a service so controllers stay
thin and the integration is testable/replaceable in one place:
`gemini.js` (AI), `exchangeRate.js`, `weather.js`, `geocode.js` (Nominatim),
`overpass.js` (OSM places), `adzuna.js` (jobs), `scraper.js`, `alumniData.js`,
`prPoints.js` (pure rules — no network).

**Pattern 1 — proxy external APIs through our backend.** React never calls
Hipolabs/Gemini/Adzuna directly. Why (memorize this): ① API keys stay on the
server ② no CORS problems ③ one place to cache ④ one place to handle failures.

**Pattern 2 — in-memory cache.** `const cache = new Map()` storing
`{ data, expires }`, checked before the expensive call:
`if (hit && hit.expires > Date.now()) return hit.data;`
Why a Map, not Redis? Single server instance, small data, zero cost. Trade-off:
cache dies on restart — acceptable here.

**Pattern 3 — fail-soft.** Optional enrichments (weather, geocoding) return
`null` on failure instead of throwing, so a broken third-party API never kills a
whole feature.

**Pattern 4 — Gemini JSON mode.** `generateJSON(prompt, schema)` sets
`responseMimeType: "application/json"` + a `responseSchema`, so Gemini must fill
our exact structure — no fragile text parsing. `temperature: 0` makes output
deterministic (same input → same output), which the scraper's duplicate
detection depends on.

## Real-time layer (Socket.io)

- Client connects with its JWT (`client/src/lib/socket.js`); the server verifies
  it in `io.use(...)` middleware — no valid token, no socket.
- Rooms: `user:<id>` (personal — unread badges, alerts) and `convo:<id>`
  (a chat thread). Live messages broadcast to the room; REST serves history.
- Rule of thumb to quote: **REST for state, sockets for events.**

## Running & environment

- `server/.env` holds all secrets (git-ignored; `.env.example` documents them).
  **Changing `.env` requires a server restart** — `node --watch` reloads code,
  not env vars.
- Run: two terminals — `cd server && npm run dev`, `cd client && npm run dev`.
- Vite dev proxy (`client/vite.config.js`) forwards `/api` and `/socket.io`
  (WebSocket) to `localhost:5000` — that's why fetch calls use relative URLs.
- Seed scripts (`server/src/scripts/`): `seedAdmin.js`, `seedKnowledge.js`
  (RAG embeddings), `seedAbroadStudents.js`, `seedForum.js`.

## Generic viva questions everyone should be able to answer

1. Walk me through what happens when the browser calls `POST /api/bookings`.
   *(route → protect → authorize("student") → controller → conflict check →
   Mongoose create → system chat message → JSON back)*
2. Where would you add a new endpoint? *(controller function → routes file →
   mounted path in app.js — show you can do it live)*
3. Why does every list endpoint filter by `req.user._id`? *(ownership scoping —
   users can only touch their own data; the DB query itself enforces it)*
4. What stops a student from calling an admin endpoint with Postman?
   *(authorize middleware reads the role from the DB-loaded user, not the client)*
5. Why Mongoose over the raw MongoDB driver? *(schemas/validation, hooks like
   password hashing, indexes declared with the model)*
