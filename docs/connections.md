# Connect — the person-to-person network

Lets a student build a real network out of the strangers they meet across the
platform, instead of losing them after one conversation.

**Files:** `server/src/models/Connection.js` ·
`server/src/controllers/connection.controller.js` ·
`server/src/routes/connection.routes.js` ·
`client/src/components/Connect.jsx` (button + shared store) ·
`client/src/pages/Connections.jsx` · Connect buttons wired into
`NetworkMap.jsx`, `Mentors.jsx`, `Forum.jsx`

## The model decision: request → accept, not instant follow

Pressing Connect sends a **request**; the other person accepts. Two reasons:

1. Anyone can already message anyone (peer chat), so the *value* of a
   connection is that it's mutual — a curated list of people who agreed.
2. An instant one-way add lets a single user spam themselves onto a hundred
   lists. A request can be declined.

The one shortcut: **if they already sent you a request, pressing Connect
accepts it** rather than creating a mirror-image row. That's what a user
expects, and it means the two-sided race resolves to one connection.

## Schema

```js
{ requester, recipient, status: "pending"|"accepted", pairKey, acceptedAt }
```

`pairKey` is the sorted `"idA:idB"` string with a **unique index** — the same
trick as `Conversation`. A multikey index over an array can't express "this
unordered pair appears at most once"; a derived scalar can. `requester` is kept
(rather than just a members array) so the UI can say "wants to connect with
you" vs "request sent" without a second lookup.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/connections` | Send request (auto-accepts if they asked first) |
| GET | `/api/connections?q=` | My accepted connections, searched server-side |
| GET | `/api/connections/pending` | `{ incoming, outgoing, incomingCount }` |
| PUT | `/api/connections/:id/accept` | Recipient accepts |
| DELETE | `/api/connections/:id` | Decline / cancel / disconnect — one endpoint |
| GET | `/api/connections/status?userIds=a,b,c` | **Bulk** button states |

Two things worth pointing at in a viva:

- **DELETE serves three user-facing actions.** Declining a request, cancelling
  one you sent, and removing an existing connection are all "delete this row",
  and ownership is enforced in the query (`$or: [requester, recipient]`) rather
  than in an `if`.
- **The bulk status endpoint exists for a reason.** A forum feed of 12 posts
  would otherwise fire 12 status requests. `useConnectionStatuses()` collects
  every id on the page and asks once.

## Client architecture

`ConnectionsProvider` (mounted in `App.jsx` around the app shell) holds one
status store, so the sidebar badge and every Connect button on the page share
state. When a button changes a status it writes to the store and *all* buttons
for that person re-render. `connections:update` sockets from the server
invalidate it when the other side acts, so an accept elsewhere updates your
open tab.

## Where you can press Connect

- **Network Map** — sidebar cards, next to "Say hi"
- **Mentors** — beside Book session / Message
- **Forum** — next to any post author

## Connections page (`/connections`)

Tabs for **Connections** and **Requests** (incoming shown first, outgoing below
as "waiting for them"). Search hits name, university, city and country
server-side, debounced 250 ms. Each row offers Message (opens the chat thread)
and Remove. Presence dots come from the same socket feed as the map.

## Chat integration

- **Search bar** filters conversations by person name **and last-message text**,
  so "visa" finds the thread where visas came up.
- **`+` button** switches the list into a picker of connections you haven't
  messaged yet; choosing one opens the thread. Says "All caught up" when you
  already have a thread with everyone.

## Viva Q&A

- *Why not just let people message anyone?* They can — that's peer chat. The
  connection list is the curated subset you want to keep track of.
- *How do you prevent duplicate connections?* Unique index on the derived
  `pairKey`, so the database rejects it regardless of who pressed first.
- *What happens if we both press Connect simultaneously?* The second one finds
  the existing pending row and accepts it, because the requester isn't them.
- *Why one bulk status endpoint instead of per-card?* N+1 requests. One call
  per page, shared through context.
