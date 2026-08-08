import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";

// One bubble in the thread.
function Bubble({ msg, mine }) {
  if (msg.isSystem) {
    return (
      <div className="my-2 text-center">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          {msg.text}
        </span>
      </div>
    );
  }
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
        mine
          ? "rounded-br-sm bg-indigo-600 text-white"
          : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
      }`}>
        {msg.text}
        <div className={`mt-0.5 text-right text-[10px] ${mine ? "text-indigo-200" : "text-slate-400"}`}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const loadInbox = useCallback(() => {
    api("/api/chat").then((d) => setConversations(d.conversations)).catch(() => {});
  }, []);

  // Inbox: load + refresh whenever the server says something changed.
  useEffect(() => {
    loadInbox();
    const socket = getSocket();
    socket?.on("inbox:update", loadInbox);
    return () => socket?.off("inbox:update", loadInbox);
  }, [loadInbox]);

  // Thread: load history + join the socket room for live messages.
  useEffect(() => {
    if (!activeId) return;
    api(`/api/chat/${activeId}/messages`)
      .then((d) => { setMessages(d.messages); loadInbox(); })
      .catch(() => setMessages([]));

    const socket = getSocket();
    socket?.emit("convo:join", activeId);

    const onNew = (msg) => {
      if (msg.conversation !== activeId) return;
      // Dedupe: our own messages arrive twice (send-ack + room broadcast).
      setMessages((m) => (m.some((x) => x._id === msg._id) ? m : [...m, msg]));
      // I'm looking at this thread, so a live incoming message is instantly
      // read — otherwise the navbar badge would stay red forever.
      if (String(msg.sender) !== String(user.id)) {
        socket?.emit("convo:read", activeId);
      }
    };
    socket?.on("message:new", onNew);

    return () => {
      socket?.emit("convo:leave", activeId);
      socket?.off("message:new", onNew);
    };
  }, [activeId, loadInbox, user.id]);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");
    // The ack adds our own message; the room broadcast may deliver it too,
    // so both paths dedupe by _id.
    getSocket()?.emit("message:send", { conversationId: activeId, text }, (res) => {
      if (res?.ok) {
        setMessages((m) =>
          m.some((x) => x._id === res.message._id) ? m : [...m, res.message]
        );
      }
    });
  };

  // Peer-to-peer: the API tells us who the other side is, whatever their role.
  const otherName = (c) => c.other?.name ?? "Unknown";
  const active = conversations.find((c) => c.id === activeId);

  // Not everyone is a mentor anymore — label who you're talking to.
  const RoleTag = ({ role }) =>
    role ? (
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        role === "mentor"
          ? "bg-indigo-50 text-indigo-600"
          : "bg-emerald-50 text-emerald-700"
      }`}>
        {role === "mentor" ? "Mentor" : "Student"}
      </span>
    ) : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 gap-4 px-4 py-8">
      {/* Inbox */}
      <aside className="w-64 shrink-0">
        <h1 className="mb-3 text-lg font-bold text-slate-800">💬 Chats</h1>
        {conversations.length === 0 ? (
          <p className="text-sm text-slate-400">
            No conversations yet
            {user.role === "student" &&
              " — message a mentor, or say hi to a student on the Network Map"}.
          </p>
        ) : (
          <div className="space-y-1">
            {conversations.map((c) => (
              <button key={c.id} onClick={() => setParams({ c: c.id })}
                className={`w-full rounded-lg px-3 py-2.5 text-left ${
                  c.id === activeId ? "bg-indigo-50" : "hover:bg-slate-100"
                }`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    {otherName(c)} <RoleTag role={c.other?.role} />
                  </span>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-slate-400">{c.lastMessageText}</p>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Thread */}
      <section className="flex min-h-[70vh] flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50">
        {!activeId ? (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            Select a conversation
          </div>
        ) : (
          <>
            {active?.other && (
              <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
                <span className="font-medium text-slate-800">{active.other.name}</span>
                <RoleTag role={active.other.role} />
                {active.other.university && (
                  <span className="truncate text-xs text-slate-400">
                    🎓 {active.other.university}
                  </span>
                )}
              </div>
            )}
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {messages.map((m) => (
                <Bubble key={m._id} msg={m}
                  mine={m.sender && String(m.sender) === String(user.id)} />
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3">
              <input value={draft} onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:outline-none" />
              <button type="submit" disabled={!draft.trim()}
                className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
