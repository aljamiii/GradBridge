// CONTROLLER: the notification centre.
import Notification from "../models/Notification.js";

// GET /api/notifications — newest 30 + how many are unread.
export const listNotifications = async (req, res, next) => {
  try {
    const [notifications, unread] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({ success: true, unread, notifications });
  } catch (err) {
    next(err);
  }
};

// PUT /api/notifications/read  body: { id }  — omit id to mark ALL read.
export const markRead = async (req, res, next) => {
  try {
    const filter = { user: req.user._id, read: false };
    if (req.body.id) filter._id = req.body.id;
    await Notification.updateMany(filter, { read: true });
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, unread });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/notifications — clear the list (read ones only, so a fresh
// unread notification arriving mid-click isn't silently destroyed).
export const clearRead = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id, read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
