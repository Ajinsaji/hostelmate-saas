import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getOwnerToken, getAdminToken } from "../utils/authToken";

// ─────────────────────────────────────────────────────────────────────────────
// SOCKET SINGLETON DESIGN
//
// The module-level socket is shared across component mounts to avoid
// reconnecting on every re-render. HOWEVER: when the authenticated user
// changes (Owner A logs out → Owner B logs in within the same browser context),
// the old socket must be destroyed and a new one created with B's JWT.
//
// Without this, Owner B would inherit A's authenticated socket connection
// and receive notifications from A's user_<ownerAId> room — a security defect.
// ─────────────────────────────────────────────────────────────────────────────

let socket = null;
let socketUrl = null;
let activeListeners = 0;
let currentToken = null; // tracks which JWT the current socket is authenticated with

function resolveSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  if (!apiUrl) {
    return window.location.origin;
  }
  try {
    const parsed = new URL(apiUrl);
    return parsed.origin;
  } catch {
    return apiUrl;
  }
}

function getAuthToken() {
  const pathname = window.location.pathname || "";
  const isAdmin = pathname.startsWith("/admin");
  const token = isAdmin ? getAdminToken() : getOwnerToken();
  return token || getOwnerToken() || getAdminToken();
}

/**
 * Returns the singleton socket, creating a new one if needed.
 *
 * KEY SECURITY RULE: if the token has changed since the socket was created
 * (i.e. a different user logged in), destroy the old socket first.
 * The server derives userId from the JWT — a stale socket stays in the
 * old user's room and would receive their notifications.
 */
function createSocket() {
  const newToken = getAuthToken();

  // Detect user switch: token changed → destroy old socket unconditionally
  if (socket && newToken !== currentToken) {
    console.info(
      "[NOTIFICATION SOCKET] Auth token changed — destroying stale socket before creating new one"
    );
    socket.off();
    socket.disconnect();
    socket = null;
    currentToken = null;
    activeListeners = 0;
  }

  if (socket) return socket;

  socketUrl = resolveSocketUrl();
  currentToken = newToken;

  socket = io(socketUrl, {
    transports: ["websocket", "polling"],
    auth: {
      token: currentToken,
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  return socket;
}

function cleanupSocket() {
  if (!socket) return;
  activeListeners -= 1;
  if (activeListeners <= 0) {
    socket.off();
    socket.disconnect();
    socket = null;
    currentToken = null;
    activeListeners = 0;
  }
}

export default function useNotificationSocket({
  enabled = true,
  onNotification,
  onConnect,
  onDisconnect,
  onError,
  onReconnect,
} = {}) {
  const [connected, setConnected] = useState(false);
  const onNotificationRef = useRef(onNotification);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => { onNotificationRef.current = onNotification; }, [onNotification]);
  useEffect(() => { onConnectRef.current = onConnect; }, [onConnect]);
  useEffect(() => { onDisconnectRef.current = onDisconnect; }, [onDisconnect]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);

  useEffect(() => {
    if (!enabled) return undefined;

    const authToken = getAuthToken();
    if (!authToken) return undefined;

    const client = createSocket();
    activeListeners += 1;

    const handleConnect = () => {
      setConnected(true);
      onConnectRef.current?.();
    };

    const handleDisconnect = (reason) => {
      setConnected(false);
      onDisconnectRef.current?.(reason);
    };

    const handleError = (error) => {
      onErrorRef.current?.(error);
    };

    const handleReconnect = (attempt) => {
      onReconnectRef.current?.(attempt);
    };

    const handleNotification = (payload) => {
      onNotificationRef.current?.(payload);
    };

    client.on("connect", handleConnect);
    client.on("disconnect", handleDisconnect);
    client.on("connect_error", handleError);
    client.on("reconnect_error", handleError);
    client.on("reconnect_attempt", handleReconnect);
    client.on("notification:new", handleNotification);

    return () => {
      if (!client) return;
      client.off("connect", handleConnect);
      client.off("disconnect", handleDisconnect);
      client.off("connect_error", handleError);
      client.off("reconnect_error", handleError);
      client.off("reconnect_attempt", handleReconnect);
      client.off("notification:new", handleNotification);
      cleanupSocket();
    };
  }, [enabled]);

  return useMemo(() => ({ connected }), [connected]);
}
