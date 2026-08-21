import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import Icon from "../components/Icon";
import { useConnections } from "../components/Connect";
import {
  Alert, Avatar, Badge, Button, Card, EmptyState, Input, Page, PageHeader, Skeleton, cx,
} from "../components/ui";

/* ------------------------------------------------------------ person card */

function PersonCard({ person, online, actions, meta }) {
  return (
    <Card className="!p-4">
      <div className="flex items-start gap-3.5">
        <Avatar name={person.name} size="md" online={online} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-snug text-ink-900">{person.name}</p>
            <Badge tone={person.role === "mentor" ? "brand" : "green"}>
              {person.role === "mentor" ? "Mentor" : "Student"}
            </Badge>
            {online && <Badge tone="sky">Online</Badge>}
          </div>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-ink-400">
            {person.university && (
              <span className="flex items-center gap-1">
                <Icon name="graduation" className="h-3.5 w-3.5" />{person.university}
              </span>
            )}
            {(person.city || person.country) && (
              <span className="flex items-center gap-1">
                <Icon name="location" className="h-3.5 w-3.5" />
                {[person.city, person.country].filter(Boolean).join(", ")}
              </span>
            )}
            {person.subject && (
              <span className="flex items-center gap-1">
                <Icon name="book" className="h-3.5 w-3.5" />{person.subject}
              </span>
            )}
          </p>

          {person.helpWith?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {person.helpWith.map((h) => (
                <span key={h}
                  className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-500/15">
                  {h}
                </span>
              ))}
            </div>
          )}

          {meta && <p className="mt-2 text-[11px] text-ink-400">{meta}</p>}
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">{actions}</div>
      </div>
    </Card>
  );
}

const since = (d) => {
  if (!d) return null;
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(d).toLocaleDateString([], { month: "short", year: "numeric" });
};

/* -------------------------------------------------------------------- page */

export default function Connections() {
  const navigate = useNavigate();
  const { refreshPending } = useConnections();

  const [tab, setTab] = useState("connections");
  const [query, setQuery] = useState("");
  const [connections, setConnections] = useState(null);
  const [pending, setPending] = useState({ incoming: [], outgoing: [] });
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback((q = "") => {
    const search = q ? `?q=${encodeURIComponent(q)}` : "";
    Promise.all([
      api(`/api/connections${search}`),
      api("/api/connections/pending"),
    ])
      .then(([c, p]) => {
        setConnections(c.connections);
        setPending({ incoming: p.incoming, outgoing: p.outgoing });
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced server-side search — the API searches name, university, city.
  useEffect(() => {
    const t = setTimeout(() => load(query), 250);
    return () => clearTimeout(t);
  }, [query, load]);

  // Presence, shared with the map and chat.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () =>
      socket.emit("presence:get", (ids) => setOnlineIds(new Set((ids ?? []).map(String))));
    if (socket.connected) refresh();
    socket.on("connect", refresh);
    const onPresence = ({ userId, online }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    const onConnections = () => load(query);
    socket.on("presence:update", onPresence);
    socket.on("connections:update", onConnections);
    return () => {
      socket.off("presence:update", onPresence);
      socket.off("connections:update", onConnections);
      socket.off("connect", refresh);
    };
  }, [load, query]);

  const act = async (id, fn) => {
    setBusy(id);
    setError("");
    try { await fn(); load(query); refreshPending(); }
    catch (err) { setError(err.message); }
    finally { setBusy(""); }
  };

  const accept = (c) => act(c.connectionId, () =>
    api(`/api/connections/${c.connectionId}/accept`, { method: "PUT" }));

  const remove = (c) => act(c.connectionId, () =>
    api(`/api/connections/${c.connectionId}`, { method: "DELETE" }));

  const message = async (person) => {
    try {
      const d = await api("/api/chat/start", { method: "POST", body: { userId: person.id } });
      navigate(`/chat?c=${d.conversationId}`);
    } catch (err) { setError(err.message); }
  };

  const isOnline = (p) => onlineIds.has(String(p.id));
  const incomingCount = pending.incoming.length;

  return (
    <Page width="5xl">
      <PageHeader
        eyebrow="Your network"
        title="Connections"
        description="People you've connected with across the platform — from the map, the forum, or the mentor directory."
        actions={
          <Button to="/network-map" variant="secondary">
            <Icon name="map" className="h-4 w-4" /> Find people
          </Button>
        }
      />

      {/* tabs */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-white/50 p-1 backdrop-blur-sm ring-1 ring-white/60">
          {[
            { id: "connections", label: "Connections", count: connections?.length },
            { id: "requests", label: "Requests", count: incomingCount || null },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cx("relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                tab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-ink-400 hover:text-ink-700")}>
              {t.label}
              {t.count != null && (
                <span className={cx("ml-1.5 text-xs",
                  t.id === "requests" && incomingCount > 0 ? "text-red-500" : "opacity-60")}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "connections" && (
          <div className="relative min-w-56 flex-1">
            <Icon name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, university or city…" className="!pl-9" />
          </div>
        )}
      </div>

      {error && <Alert tone="error" className="mt-4">{error}</Alert>}

      <div className="mt-5 space-y-3">
        {/* ------------------------------------------------ connections */}
        {tab === "connections" && (
          connections === null ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : connections.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Icon name="users" className="h-6 w-6" />}
                title={query ? "No one matches that search" : "No connections yet"}
                description={query
                  ? "Try a different name, university or city."
                  : "Press Connect on anyone you meet — on the Network Map, in the Forum, or in the mentor directory — and they'll show up here once they accept."}
                action={!query && (
                  <Button to="/network-map" variant="secondary">
                    <Icon name="map" className="h-4 w-4" /> Browse the Network Map
                  </Button>
                )}
              />
            </Card>
          ) : (
            connections.map((c) => (
              <PersonCard key={c.connectionId} person={c} online={isOnline(c)}
                meta={c.connectedAt ? `Connected ${since(c.connectedAt)}` : null}
                actions={
                  <>
                    <Button size="sm" onClick={() => message(c)}>
                      <Icon name="message" className="h-3.5 w-3.5" /> Message
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy === c.connectionId}
                      onClick={() => remove(c)} className="text-ink-400 hover:text-red-600">
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </Button>
                  </>
                } />
            ))
          )
        )}

        {/* ---------------------------------------------------- requests */}
        {tab === "requests" && (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
              Waiting for you ({incomingCount})
            </p>
            {incomingCount === 0 ? (
              <Card>
                <EmptyState
                  icon={<Icon name="bell" className="h-6 w-6" />}
                  title="No pending requests"
                  description="When someone presses Connect on your profile, their request lands here."
                />
              </Card>
            ) : (
              pending.incoming.map((c) => (
                <PersonCard key={c.connectionId} person={c} online={isOnline(c)}
                  meta={`Requested ${since(c.sentAt)}`}
                  actions={
                    <>
                      <Button size="sm" disabled={busy === c.connectionId} onClick={() => accept(c)}>
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} /> Accept
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy === c.connectionId}
                        onClick={() => remove(c)} className="text-ink-400 hover:text-red-600">
                        Decline
                      </Button>
                    </>
                  } />
              ))
            )}

            {pending.outgoing.length > 0 && (
              <>
                <p className="pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Sent by you ({pending.outgoing.length})
                </p>
                {pending.outgoing.map((c) => (
                  <PersonCard key={c.connectionId} person={c} online={isOnline(c)}
                    meta={`Sent ${since(c.sentAt)} · waiting for them to accept`}
                    actions={
                      <Button size="sm" variant="ghost" disabled={busy === c.connectionId}
                        onClick={() => remove(c)} className="text-ink-400 hover:text-red-600">
                        Cancel
                      </Button>
                    } />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
