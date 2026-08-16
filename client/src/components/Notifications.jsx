// The notification bell + its dropdown, and the store behind them.
// Notifications are persisted server-side, pushed live over the chat socket,
// and mirrored as a toast when they arrive while you're looking at the app.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import Icon from "./Icon";
import { Avatar, cx } from "./ui";

const NotificationsContext = createContext(null);

// Each type gets an icon + tint so the list is scannable without reading.
const TYPE_META = {
  "connection:request": { icon: "userPlus", chip: "bg-brand-500/12 text-brand-600" },
  "connection:accepted": { icon: "check", chip: "bg-emerald-500/12 text-emerald-600" },
  "booking:requested": { icon: "calendar", chip: "bg-brand-500/12 text-brand-600" },
  "booking:confirmed": { icon: "check", chip: "bg-emerald-500/12 text-emerald-600" },
  "booking:declined": { icon: "close", chip: "bg-red-500/12 text-red-600" },
  "booking:cancelled": { icon: "close", chip: "bg-amber-500/12 text-amber-600" },
  "forum:reply": { icon: "message", chip: "bg-sky-500/12 text-sky-600" },
};

const timeAgo = (d) => {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => {
    if (!user) return;
    api("/api/notifications")
      .then((d) => { setItems(d.notifications); setUnread(d.unread); })
      .catch(() => {});
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Live arrivals: prepend, bump the badge, and surface a toast so the user
  // notices without watching the bell.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const onNew = (n) => {
      setItems((list) => [n, ...list].slice(0, 30));
      setUnread((u) => u + 1);
      toast(n.title, { body: n.body, tone: "info", onClick: () => { window.location.href = n.link || "/"; } });
    };
    socket?.on("notification:new", onNew);
    return () => socket?.off("notification:new", onNew);
  }, [user, toast]);

  const markAllRead = useCallback(async () => {
    setUnread(0);
    setItems((l) => l.map((n) => ({ ...n, read: true })));
    try { await api("/api/notifications/read", { method: "PUT", body: {} }); } catch { load(); }
  }, [load]);

  const markOneRead = useCallback(async (id) => {
    setItems((l) => l.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await api("/api/notifications/read", { method: "PUT", body: { id } }); } catch { load(); }
  }, [load]);

  const value = useMemo(
    () => ({ items, unread, load, markAllRead, markOneRead }),
    [items, unread, load, markAllRead, markOneRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsContext) ?? {
    items: [], unread: 0, load: () => {}, markAllRead: () => {}, markOneRead: () => {},
  };
}

/* -------------------------------------------------------------------- bell */

export default function NotificationBell() {
  const { items, unread, markAllRead, markOneRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = (n) => {
    if (!n.read) markOneRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className={cx("relative rounded-lg p-2 transition-colors",
          open ? "bg-brand-500/12 text-brand-700" : "text-ink-500 hover:bg-white/70 hover:text-ink-900")}>
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-rise absolute right-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[var(--shadow-float)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/70 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead}
                className="text-xs font-semibold text-brand-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-ink-400">
                  <Icon name="bell" className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-ink-900">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-ink-400">
                  Connection requests, session updates and forum replies land here.
                </p>
              </div>
            ) : (
              items.map((n) => {
                const meta = TYPE_META[n.type] ?? { icon: "bell", chip: "bg-slate-100 text-ink-500" };
                return (
                  <button key={n._id} onClick={() => openItem(n)}
                    className={cx("flex w-full gap-3 border-b border-white/60 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white",
                      !n.read && "bg-brand-500/[0.06]")}>
                    {n.actorName
                      ? <Avatar name={n.actorName} size="sm" />
                      : <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", meta.chip)}>
                          <Icon name={meta.icon} className="h-4 w-4" />
                        </span>}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className={cx("block text-sm leading-snug",
                          n.read ? "text-ink-500" : "font-semibold text-ink-900")}>
                          {n.title}
                        </span>
                        {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      {n.body && <span className="mt-0.5 block truncate text-xs text-ink-400">{n.body}</span>}
                      <span className="mt-0.5 block text-[10px] text-ink-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
