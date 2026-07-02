import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getOwnerToken, getAdminToken } from "../utils/authToken";

let socket = null;
let socketUrl = null;
let activeListeners = 0;
let currentToken = null;

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

function createSocket() {
  if (socket) return socket;

  socketUrl = resolveSocketUrl();
  currentToken = getAuthToken();
  socket = io(socketUrl, {
    transports: ["websocket"],
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

export default function useNotificationSocket({ enabled = true, onNotification, onConnect, onDisconnect, onError, onReconnect } = {}) {
  const [connected, setConnected] = useState(false);
  const onNotificationRef = useRef(onNotification);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

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

  return useMemo(
    () => ({ connected }),
    [connected]
  );
}
