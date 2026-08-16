// CONTROLLER: the Connect network — request, accept, remove, and the
// status lookups the Connect buttons need.
import Connection from "../models/Connection.js";
import User from "../models/User.js";
import { getIO } from "../socket.js";
import { notify } from "../services/notify.js";

// What we expose about another person. Never emails, never raw profiles.
const publicPerson = (u) => ({
  id: u._id,
  name: u.name,
  role: u.role,
  university: u.mentorProfile?.university ?? u.studentProfile?.abroad?.university ?? null,
  city: u.studentProfile?.abroad?.city ?? null,
  country: u.studentProfile?.abroad?.country ?? null,
  subject: u.studentProfile?.abroad?.subject ?? u.studentProfile?.researchInterest ?? null,
  helpWith: u.studentProfile?.abroad?.helpWith ?? [],
});

const PERSON_FIELDS =
  "name role mentorProfile.university studentProfile.abroad studentProfile.researchInterest";

// Ping both sides so open tabs refresh their badges/lists.
const notifySockets = (...userIds) => {
  const io = getIO();
  if (!io) return;
  for (const id of userIds) io.to(`user:${id}`).emit("connections:update");
};

/* --------------------------------------------------------------- mutations */

// POST /api/connections   body: { userId }
// Pressing Connect. If THEY already sent you one, this accepts it instead of
// creating a mirror-image request — the natural thing to expect.
export const sendRequest = async (req, res, next) => {
  try {
    const me = String(req.user._id);
    const them = String(req.body.userId ?? "");

    if (!them) return res.status(400).json({ success: false, message: "Who do you want to connect with?" });
    if (me === them) return res.status(400).json({ success: false, message: "You can't connect with yourself." });

    const other = await User.findById(them).select(PERSON_FIELDS);
    if (!other) return res.status(404).json({ success: false, message: "User not found." });

    const pairKey = Connection.pairKeyFor(me, them);
    const existing = await Connection.findOne({ pairKey });

    if (existing) {
      if (existing.status === "accepted") {
        return res.json({ success: true, status: "accepted", connection: existing });
      }
      // They asked first → pressing Connect accepts.
      if (String(existing.requester) === them) {
        existing.status = "accepted";
        existing.acceptedAt = new Date();
        await existing.save();
        notifySockets(me, them);
        await notify({
          user: other._id,
          type: "connection:accepted",
          title: `${req.user.name} accepted your connection request`,
          body: "You can message each other any time.",
          link: "/connections",
          actor: req.user,
        });
        return res.json({ success: true, status: "accepted", connection: existing });
      }
      // I already asked → nothing to do.
      return res.json({ success: true, status: "pending", connection: existing });
    }

    const connection = await Connection.create({
      requester: req.user._id,
      recipient: other._id,
      pairKey,
    });
    notifySockets(me, them);
    await notify({
      user: other._id,
      type: "connection:request",
      title: `${req.user.name} wants to connect`,
      body: "Accept to add them to your network.",
      link: "/connections",
      actor: req.user,
    });
    res.status(201).json({ success: true, status: "pending", connection });
  } catch (err) {
    next(err);
  }
};

// PUT /api/connections/:id/accept — only the RECIPIENT may accept.
export const acceptRequest = async (req, res, next) => {
  try {
    const connection = await Connection.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      status: "pending",
    });
    if (!connection) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }
    connection.status = "accepted";
    connection.acceptedAt = new Date();
    await connection.save();
    notifySockets(connection.requester, connection.recipient);
    // The whole point of this feature: tell the person who asked.
    await notify({
      user: connection.requester,
      type: "connection:accepted",
      title: `${req.user.name} accepted your connection request`,
      body: "You can message each other any time.",
      link: "/connections",
      actor: req.user,
    });
    res.json({ success: true, connection });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/connections/:id — decline, cancel, or disconnect.
// One endpoint for all three: in every case the row goes away, and either
// party may do it (ownership enforced in the query).
export const removeConnection = async (req, res, next) => {
  try {
    const connection = await Connection.findOneAndDelete({
      _id: req.params.id,
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    });
    if (!connection) {
      return res.status(404).json({ success: false, message: "Connection not found." });
    }
    notifySockets(connection.requester, connection.recipient);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------------------------- queries */

// GET /api/connections?q=  — my accepted connections, optionally searched.
export const listConnections = async (req, res, next) => {
  try {
    const rows = await Connection.find({
      status: "accepted",
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    })
      .sort({ acceptedAt: -1 })
      .populate("requester", PERSON_FIELDS)
      .populate("recipient", PERSON_FIELDS);

    const q = (req.query.q || "").trim().toLowerCase();

    const connections = rows
      .map((r) => {
        const other = String(r.requester._id) === String(req.user._id) ? r.recipient : r.requester;
        return { connectionId: r._id, connectedAt: r.acceptedAt, ...publicPerson(other) };
      })
      // Search covers the fields a person would actually recall.
      .filter((c) =>
        !q ||
        [c.name, c.university, c.city, c.country, c.subject].some((v) =>
          (v ?? "").toLowerCase().includes(q)
        )
      );

    res.json({ success: true, count: connections.length, connections });
  } catch (err) {
    next(err);
  }
};

// GET /api/connections/pending — split into what I must answer vs what I sent.
export const listPending = async (req, res, next) => {
  try {
    const rows = await Connection.find({
      status: "pending",
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .populate("requester", PERSON_FIELDS)
      .populate("recipient", PERSON_FIELDS);

    const incoming = [];
    const outgoing = [];
    for (const r of rows) {
      if (String(r.recipient._id) === String(req.user._id)) {
        incoming.push({ connectionId: r._id, sentAt: r.createdAt, ...publicPerson(r.requester) });
      } else {
        outgoing.push({ connectionId: r._id, sentAt: r.createdAt, ...publicPerson(r.recipient) });
      }
    }
    res.json({ success: true, incoming, outgoing, incomingCount: incoming.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/connections/status?userIds=a,b,c
// Bulk lookup so a list of cards renders correct button states in ONE request
// instead of one per card.
export const getStatuses = async (req, res, next) => {
  try {
    const ids = (req.query.userIds || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json({ success: true, statuses: {} });

    const pairKeys = ids.map((id) => Connection.pairKeyFor(req.user._id, id));
    const rows = await Connection.find({ pairKey: { $in: pairKeys } });

    const statuses = {};
    for (const id of ids) {
      const row = rows.find((r) => r.pairKey === Connection.pairKeyFor(req.user._id, id));
      if (!row) statuses[id] = { state: "none" };
      else if (row.status === "accepted") statuses[id] = { state: "connected", connectionId: row._id };
      else if (String(row.requester) === String(req.user._id))
        statuses[id] = { state: "requested", connectionId: row._id };
      else statuses[id] = { state: "awaiting-me", connectionId: row._id };
    }
    res.json({ success: true, statuses });
  } catch (err) {
    next(err);
  }
};
