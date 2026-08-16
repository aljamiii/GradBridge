import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import { Avatar, Badge, Button, EmptyState, Skeleton, cx } from "../components/ui";

/* ---------------------------------------------------------------- helpers */

// How long a pause counts as "stopped typing".
const TYPING_IDLE_MS = 2500;

// Matches the `maxlength` on the Message model — stop the user at the limit
// instead of letting the server reject a long message after they hit send.
const MAX_MESSAGE_LEN = 2000;

const time = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// "Today" / "Yesterday" / "12 Aug 2026" — the separator between day groups.
const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(date, today)) return "Today";
  if (same(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const shortTime = (d) => {
  const mins = Math.floor((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};

/* ----------------------------------------------------------------- bubble */

function Bubble({ msg, mine }) {
  if (msg.isSystem) {
    return (
      <div className="my-3 flex justify-center">
        <span className="glass-inset rounded-full px-3.5 py-1.5 text-xs text-ink-500">
          {msg.text}
        </span>
      </div>
    );
  }
  return (
    <div className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[65%]",
          mine
            ? "rounded-br-md bg-gradient-to-br from-brand-600 to-brand-700 text-white"
            : "glass-card rounded-bl-md !border-white/70 text-ink-700"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        <p className={cx("mt-1 text-right text-[10px]", mine ? "text-brand-200" : "text-ink-400")}>
          {time(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

/* Three bouncing dots in a bubble shaped like an incoming message, so it
   reads as "their next message is on its way". Staggered delays per dot. */
function TypingDots({ name }) {
  return (
    <div className="flex justify-start">
      <div className="glass-card flex items-center gap-1.5 rounded-2xl rounded-bl-md !border-white/70 px-4 py-3.5 shadow-sm">
        <span className="sr-only" aria-live="polite">
          {name ? `${name} is typing…` : "Typing…"}
        </span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function Chat() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");

  const [conversations, setConversations] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false); // "new chat" panel open
  const [connections, setConnections] = useState([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef(null);
  const typingRef = useRef(false);   // what we last told the server
  const typingTimer = useRef(null);  // idle countdown → "stopped typing"

  const loadInbox = useCallback(() => {
    api("/api/chat").then((d) => setConversations(d.conversations)).catch(() => {});
  }, []);

  useEffect(() => {
    loadInbox();
    const socket = getSocket();
    socket?.on("inbox:update", loadInbox);
    return () => socket?.off("inbox:update", loadInbox);
  }, [loadInbox]);

  // Presence — same feed the Network Map uses, so dots agree across pages.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () =>
      socket.emit("presence:get", (ids) => setOnlineIds(new Set((ids ?? []).map(String))));
    if (socket.connected) refresh();
    socket.on("connect", refresh);
    const onUpdate = ({ userId, online }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        online ? next.add(String(userId)) : next.delete(String(userId));
        return next;
      });
    socket.on("presence:update", onUpdate);
    return () => {
      socket.off("presence:update", onUpdate);
      socket.off("connect", refresh);
    };
  }, []);

  // Thread: history + live room.
  useEffect(() => {
    if (!activeId) return;
    setLoadingThread(true);
    api(`/api/chat/${activeId}/messages`)
      .then((d) => { setMessages(d.messages); loadInbox(); })
      .catch(() => setMessages([]))
      .finally(() => setLoadingThread(false));

    const socket = getSocket();
    socket?.emit("convo:join", activeId);

    const onNew = (msg) => {
      if (msg.conversation !== activeId) return;
      // Dedupe: our own messages arrive twice (send-ack + room broadcast).
      setMessages((m) => (m.some((x) => x._id === msg._id) ? m : [...m, msg]));
      // Reading it live, so clear the unread immediately.
      if (String(msg.sender) !== String(user.id)) socket?.emit("convo:read", activeId);
    };
    socket?.on("message:new", onNew);

    // Their dots. A message arriving means they clearly finished typing.
    const onTyping = ({ conversationId, userId, typing }) => {
      if (conversationId !== activeId) return;
      if (String(userId) === String(user.id)) return;
      setPeerTyping(Boolean(typing));
    };
    socket?.on("typing:update", onTyping);

    return () => {
      // Leaving the thread must retract our own dots, or they'd hang on the
      // other person's screen until their next event.
      if (typingRef.current) {
        socket?.emit("typing", { conversationId: activeId, typing: false });
        typingRef.current = false;
      }
      clearTimeout(typingTimer.current);
      setPeerTyping(false);
      socket?.emit("convo:leave", activeId);
      socket?.off("message:new", onNew);
      socket?.off("typing:update", onTyping);
    };
  }, [activeId, loadInbox, user.id]);

  // Their dots stop the moment a message from them lands.
  useEffect(() => {
    setPeerTyping(false);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  // Emit only when the typing STATE changes, not on every keystroke — one
  // event when you start, one when you stop, instead of one per character.
  const signalTyping = useCallback(
    (isTyping) => {
      if (!activeId || typingRef.current === isTyping) return;
      typingRef.current = isTyping;
      getSocket()?.emit("typing", { conversationId: activeId, typing: isTyping });
    },
    [activeId]
  );

  const onDraftChange = (e) => {
    const value = e.target.value;
    setDraft(value);
    signalTyping(value.trim().length > 0);
    // Idle timeout: stop the dots if they pause mid-sentence without sending.
    clearTimeout(typingTimer.current);
    if (value.trim()) {
      typingTimer.current = setTimeout(() => signalTyping(false), TYPING_IDLE_MS);
    }
  };

  const send = (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !activeId || sending) return;

    setDraft("");
    setSendError("");
    setSending(true);
    clearTimeout(typingTimer.current);
    signalTyping(false); // the message itself is the end of typing

    // Never drop a message silently: if the server rejects it (or the socket
    // is down and never acks), put the text back so the user can retry.
    const restore = (why) => {
      setSending(false);
      setDraft((d) => d || text);
      setSendError(why);
    };
    const ackTimer = setTimeout(() => restore("Message not sent — check your connection."), 8000);

    const socket = getSocket();
    if (!socket) return restore("You're offline. Reconnect to send messages.");

    socket.emit("message:send", { conversationId: activeId, text }, (res) => {
      clearTimeout(ackTimer);
      if (res?.ok) {
        setSending(false);
        setMessages((m) => (m.some((x) => x._id === res.message._id) ? m : [...m, res.message]));
      } else {
        restore(res?.error || "Message not sent.");
      }
    });
  };

  // Explicit Enter-to-send. An <input> submits on Enter implicitly, but being
  // explicit keeps it working if the composer ever becomes a textarea.
  const onComposerKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Connections power the "new chat" picker.
  useEffect(() => {
    api("/api/connections").then((d) => setConnections(d.connections)).catch(() => {});
  }, []);

  const active = conversations?.find((c) => c.id === activeId);
  const totalUnread = (conversations ?? []).reduce((n, c) => n + c.unread, 0);

  // Search filters on the person's name AND the last message, so "visa"
  // finds the thread where visas were discussed.
  const q = query.trim().toLowerCase();
  const filtered = (conversations ?? []).filter((c) =>
    !q ||
    (c.other?.name ?? "").toLowerCase().includes(q) ||
    (c.lastMessageText ?? "").toLowerCase().includes(q)
  );

  // Connections you haven't opened a thread with yet.
  const chattableIds = new Set((conversations ?? []).map((c) => String(c.other?.id)));
  const newChatOptions = connections
    .filter((p) => !chattableIds.has(String(p.id)))
    .filter((p) => !q || p.name.toLowerCase().includes(q));

  const startChat = async (person) => {
    try {
      const d = await api("/api/chat/start", { method: "POST", body: { userId: person.id } });
      setPicking(false);
      setQuery("");
      loadInbox();
      setParams({ c: d.conversationId });
    } catch { /* the inbox stays as-is */ }
  };

  // Group messages by calendar day for the date separators.
  const grouped = useMemo(() => {
    const groups = [];
    for (const m of messages) {
      const label = dayLabel(m.createdAt);
      if (!groups.length || groups[groups.length - 1].label !== label) {
        groups.push({ label, items: [m] });
      } else {
        groups[groups.length - 1].items.push(m);
      }
    }
    return groups;
  }, [messages]);

  const isOnline = (c) => c?.other && onlineIds.has(String(c.other.id));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
      <div className="glass-card flex w-full overflow-hidden rounded-2xl">
        {/* ------------------------------------------------------- inbox */}
        <aside
          className={cx(
            "w-full shrink-0 flex-col border-r border-white/60 sm:flex sm:w-72",
            activeId ? "hidden sm:flex" : "flex"
          )}
          style={{ height: "calc(100vh - 8.5rem)" }}
        >
          <div className="border-b border-white/60 px-3 pb-3 pt-3.5">
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <h1 className="font-bold text-ink-900">Messages</h1>
              {totalUnread > 0 && <Badge tone="red">{totalUnread}</Badge>}
              <button onClick={() => setPicking((v) => !v)}
                title="Start a new chat with a connection"
                className={cx("ml-auto rounded-lg p-1.5 transition-colors",
                  picking ? "bg-brand-500/15 text-brand-700" : "text-ink-400 hover:bg-white/70 hover:text-brand-600")}>
                <Icon name={picking ? "close" : "plus"} className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
            <div className="relative">
              <Icon name="search"
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={picking ? "Search connections…" : "Search messages…"}
                className="w-full rounded-xl border border-white/70 bg-white/60 py-2 pl-8.5 pr-3 text-sm text-ink-900 placeholder-slate-400 transition-colors focus:border-brand-400 focus:bg-white/90 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                style={{ paddingLeft: "2.1rem" }} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {/* new-chat picker takes over the list while open */}
            {picking ? (
              newChatOptions.length === 0 ? (
                <EmptyState
                  icon={<Icon name="users" className="h-6 w-6" />}
                  title={connections.length === 0 ? "No connections yet" : "All caught up"}
                  description={connections.length === 0
                    ? "Connect with people on the Network Map or Forum, then start a chat here."
                    : "You already have a thread with everyone you're connected to."}
                  className="!py-8"
                />
              ) : (
                newChatOptions.map((p) => (
                  <button key={p.id} onClick={() => startChat(p)}
                    className="mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/70">
                    <Avatar name={p.name} size="md" online={onlineIds.has(String(p.id))} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{p.name}</p>
                      <p className="truncate text-xs text-ink-400">
                        {p.university || p.city || (p.role === "mentor" ? "Mentor" : "Student")}
                      </p>
                    </div>
                    <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-ink-400" />
                  </button>
                ))
              )
            ) : conversations === null ? (
              <div className="space-y-2 p-1">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : filtered.length === 0 && q ? (
              <EmptyState
                icon={<Icon name="search" className="h-6 w-6" />}
                title="No matches"
                description={`Nothing matches “${query}” in names or messages.`}
                className="!py-8"
              />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={<Icon name="message" className="h-6 w-6" />}
                title="No conversations"
                description={user.role === "student"
                  ? "Message a mentor, or say hi to a student on the Network Map."
                  : "Students will appear here when they message you."}
                className="!py-10"
              />
            ) : (
              filtered.map((c) => (
                <button key={c.id} onClick={() => setParams({ c: c.id })}
                  className={cx(
                    "mb-1 flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors",
                    c.id === activeId ? "bg-brand-500/12 ring-1 ring-brand-500/20" : "hover:bg-white/70"
                  )}>
                  <Avatar name={c.other?.name} size="md"
                    online={c.other && onlineIds.has(String(c.other.id))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink-900">
                        {c.other?.name ?? "Unknown"}
                      </span>
                      <span className="shrink-0 text-[10px] text-ink-400">
                        {c.lastMessageAt && shortTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cx("truncate text-xs",
                        c.unread > 0 ? "font-medium text-ink-700" : "text-ink-400")}>
                        {c.lastMessageText || "No messages yet"}
                      </span>
                      {c.unread > 0 && (
                        <span className="flex h-4.5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ------------------------------------------------------ thread */}
        <section
          className={cx("min-w-0 flex-1 flex-col", activeId ? "flex" : "hidden sm:flex")}
          style={{ height: "calc(100vh - 8.5rem)" }}
        >
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<Icon name="message" className="h-6 w-6" />}
                title="Select a conversation"
                description="Pick someone from the list to see your history and keep talking."
              />
            </div>
          ) : (
            <>
              {/* header */}
              <div className="flex items-center gap-3 border-b border-white/60 px-4 py-3">
                <button onClick={() => setParams({})}
                  className="-ml-1 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white/70 sm:hidden"
                  aria-label="Back to conversations">
                  <Icon name="chevronRight" className="h-5 w-5 rotate-180" />
                </button>
                <Avatar name={active?.other?.name} size="sm" online={isOnline(active)} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink-900">
                    {active?.other?.name ?? "Conversation"}
                    {active?.other?.role && (
                      <Badge tone={active.other.role === "mentor" ? "brand" : "green"}>
                        {active.other.role === "mentor" ? "Mentor" : "Student"}
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {peerTyping
                      ? <span className="text-brand-600">typing…</span>
                      : isOnline(active)
                        ? <span className="text-sky-600">● Online now</span>
                        : active?.other?.university || "Offline"}
                  </p>
                </div>
              </div>

              {/* messages */}
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {loadingThread ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i}
                        className={cx("h-12 rounded-2xl", i % 2 ? "ml-auto w-1/2" : "w-2/3")} />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={<Icon name="sparkles" className="h-6 w-6" />}
                    title="Say something first"
                    description="Opening line that works: who you are, where you're applying, and one specific question."
                  />
                ) : (
                  grouped.map((g) => (
                    <div key={g.label} className="space-y-2">
                      <div className="my-3 flex items-center gap-3">
                        <span className="h-px flex-1 bg-white/70" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                          {g.label}
                        </span>
                        <span className="h-px flex-1 bg-white/70" />
                      </div>
                      {g.items.map((m) => (
                        <Bubble key={m._id} msg={m}
                          mine={m.sender && String(m.sender) === String(user.id)} />
                      ))}
                    </div>
                  ))
                )}
                {peerTyping && <TypingDots name={active?.other?.name} />}
                <div ref={bottomRef} />
              </div>

              {/* composer */}
              <div className="border-t border-white/60 p-3">
                {sendError && (
                  <div role="alert"
                    className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span className="flex-1">{sendError}</span>
                    <button type="button" onClick={() => setSendError("")}
                      className="font-semibold text-red-600 hover:text-red-800">
                      Dismiss
                    </button>
                  </div>
                )}
                <form onSubmit={send} className="flex gap-2">
                  <input value={draft} onChange={onDraftChange} onKeyDown={onComposerKeyDown}
                    maxLength={MAX_MESSAGE_LEN}
                    placeholder="Write a message…"
                    aria-label="Write a message"
                    className="flex-1 rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-ink-900 placeholder-slate-400 transition-colors focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10" />
                  <Button type="submit" disabled={!draft.trim() || sending} className="shrink-0 !px-3.5"
                    aria-label="Send message">
                    <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
                  </Button>
                </form>
                {draft.length > MAX_MESSAGE_LEN - 200 && (
                  <p className="mt-1.5 text-right text-[10px] text-ink-400">
                    {MAX_MESSAGE_LEN - draft.length} characters left
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
