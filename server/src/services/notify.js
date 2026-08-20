// SERVICE: create a notification and push it live.
//
// One helper so every feature notifies the same way — the controller that
// causes the event doesn't need to know about sockets or persistence.
import Notification from "../models/Notification.js";
import { getIO } from "../socket.js";

/**
 * @param {object} opts
 * @param {string} opts.user      who receives it
 * @param {string} opts.type      one of the Notification enum values
 * @param {string} opts.title     one line, already written for a human
 * @param {string} [opts.body]    optional detail line
 * @param {string} [opts.link]    where clicking should take them
 * @param {object} [opts.actor]   { _id, name } — who caused it
 */
export async function notify({ user, type, title, body = "", link = "", actor }) {
  // Never notify someone about their own action.
  if (actor?._id && String(actor._id) === String(user)) return null;

  const notification = await Notification.create({
    user,
    type,
    title,
    body,
    link,
    actor: actor?._id,
    actorName: actor?.name ?? "",
  });

  // Live push to every tab that user has open.
  getIO()?.to(`user:${user}`).emit("notification:new", notification);

  return notification;
}
