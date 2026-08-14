// The Connect button and the small store behind it.
//
// A list of 20 cards must not fire 20 status requests, so statuses are fetched
// in ONE bulk call per page and shared through context. Any button that changes
// a status updates the store, so every other button for that person re-renders.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import Icon from "./Icon";
import { Button, cx } from "./ui";

const ConnectionsContext = createContext(null);

export function ConnectionsProvider({ children }) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState({}); // userId → { state, connectionId }
  const [pendingCount, setPendingCount] = useState(0);

  // Ask the server about any ids we haven't seen yet — one call, many ids.
  const ensure = useCallback(async (ids) => {
    const unknown = ids.filter((id) => id && !statuses[id]);
    if (unknown.length === 0) return;
    try {
      const d = await api(`/api/connections/status?userIds=${unknown.join(",")}`);
      setStatuses((s) => ({ ...s, ...d.statuses }));
    } catch { /* buttons fall back to "connect" */ }
  }, [statuses]);

  const setStatus = useCallback((userId, next) => {
    setStatuses((s) => ({ ...s, [userId]: next }));
  }, []);

  const refreshPending = useCallback(() => {
    if (!user) return;
    api("/api/connections/pending")
      .then((d) => setPendingCount(d.incomingCount))
      .catch(() => {});
  }, [user]);

  // Keep the badge and any open cards fresh when the other side acts.
  useEffect(() => {
    if (!user) return;
    refreshPending();
    const socket = getSocket();
    const onUpdate = () => {
      refreshPending();
      setStatuses({}); // cheapest correct invalidation; cards refetch on mount
    };
    socket?.on("connections:update", onUpdate);
    return () => socket?.off("connections:update", onUpdate);
  }, [user, refreshPending]);

  const value = useMemo(
    () => ({ statuses, ensure, setStatus, pendingCount, refreshPending }),
    [statuses, ensure, setStatus, pendingCount, refreshPending]
  );

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
}

export function useConnections() {
  return useContext(ConnectionsContext) ?? {
    statuses: {}, ensure: () => {}, setStatus: () => {}, pendingCount: 0, refreshPending: () => {},
  };
}

// Call once per list with every person id on screen.
export function useConnectionStatuses(ids) {
  const { ensure } = useConnections();
  const key = ids.filter(Boolean).join(",");
  useEffect(() => {
    if (key) ensure(key.split(","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/* ---------------------------------------------------------------- button */

const LABELS = {
  none: { label: "Connect", icon: "users", variant: "secondary" },
  requested: { label: "Requested", icon: "clock", variant: "ghost" },
  "awaiting-me": { label: "Accept", icon: "check", variant: "primary" },
  connected: { label: "Connected", icon: "check", variant: "ghost" },
};

export default function ConnectButton({ userId, name, size = "sm", className, onChanged }) {
  const { user } = useAuth();
  const { statuses, setStatus } = useConnections();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!userId || String(userId) === String(user?.id)) return null;

  const state = statuses[userId]?.state ?? "none";
  const connectionId = statuses[userId]?.connectionId;
  const meta = LABELS[state];

  const click = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy || state === "requested" || state === "connected") return;
    setBusy(true);
    try {
      if (state === "none") {
        const d = await api("/api/connections", { method: "POST", body: { userId } });
        const accepted = d.status === "accepted";
        setStatus(userId, { state: accepted ? "connected" : "requested",
          connectionId: d.connection?._id });
        toast(
          accepted ? `You're now connected with ${name ?? "them"}` : "Connection request sent",
          { body: accepted ? "They had already asked to connect." : `${name ?? "They"} will see it in their notifications.` }
        );
      } else if (state === "awaiting-me") {
        await api(`/api/connections/${connectionId}/accept`, { method: "PUT" });
        setStatus(userId, { state: "connected", connectionId });
        toast(`You're now connected with ${name ?? "them"}`);
      }
      onChanged?.();
    } catch (err) {
      toast("Couldn't complete that", { body: err.message, tone: "error" });
    }
    finally { setBusy(false); }
  };

  return (
    <Button
      size={size}
      variant={meta.variant}
      onClick={click}
      disabled={busy || state === "requested"}
      title={state === "connected" ? `You and ${name ?? "this person"} are connected` : undefined}
      className={cx(state === "connected" && "!text-emerald-600", className)}
    >
      <Icon name={meta.icon} className="h-3.5 w-3.5"
        strokeWidth={state === "connected" || state === "awaiting-me" ? 2.4 : 1.8} />
      {meta.label}
    </Button>
  );
}
