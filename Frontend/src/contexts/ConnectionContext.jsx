import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

export const CONNECTION_STATES = {
  INITIALIZING: "INITIALIZING",
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  SERVER_UNAVAILABLE: "SERVER_UNAVAILABLE",
  ERROR: "ERROR",
};

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.INITIALIZING);
  const [isChecking, setIsChecking] = useState(true);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [hasCompletedInitialCheck, setHasCompletedInitialCheck] = useState(false);

  const [diagnosticData, setDiagnosticData] = useState({
    deviceOnline: null,
    serverAvailable: null,
    sessionValid: null,
    lastCheckedAt: null,
    message: "",
  });

  const isCheckingRef = useRef(false);

  const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "");
  };

  /**
   * Health check to detect server availability.
   * Includes:
   * 1. Concurrent request guard (isCheckingRef)
   * 2. 6-second AbortController timeout for slow/unstable networks
   * 3. navigator.onLine evaluation
   */
  const checkConnection = useCallback(async (force = false) => {
    if (isCheckingRef.current && !force) {
      return connectionState;
    }

    isCheckingRef.current = true;
    setIsChecking(true);

    const isDeviceOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (!isDeviceOnline) {
      const newDiag = {
        deviceOnline: false,
        serverAvailable: false,
        sessionValid: null,
        lastCheckedAt: new Date(),
        message: "Your device is not connected to the internet.",
      };
      setDiagnosticData(newDiag);
      setConnectionState(CONNECTION_STATES.OFFLINE);
      setIsChecking(false);
      setHasCompletedInitialCheck(true);
      isCheckingRef.current = false;
      return CONNECTION_STATES.OFFLINE;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const baseUrl = getApiUrl();
    const healthUrl = `${baseUrl.replace(/\/+$/, "")}/api/health`;

    try {
      const response = await fetch(healthUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        let isSessionValid = null;
        const token = localStorage.getItem("ownerToken") || localStorage.getItem("adminToken") || localStorage.getItem("token");

        if (token) {
          try {
            const verifyController = new AbortController();
            const verifyTimeout = setTimeout(() => verifyController.abort(), 4000);

            const verifyRes = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/auth/verify-session`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              signal: verifyController.signal,
            });
            clearTimeout(verifyTimeout);

            if (verifyRes.ok) {
              isSessionValid = true;
            } else if (verifyRes.status === 401) {
              isSessionValid = false;
            }
          } catch {
            // Keep sessionValid null on network verification error, DO NOT clear token or fail connection
            isSessionValid = null;
          }
        }

        const newDiag = {
          deviceOnline: true,
          serverAvailable: true,
          sessionValid: isSessionValid,
          lastCheckedAt: new Date(),
          message: "HostelMate is fully reachable.",
        };
        setDiagnosticData(newDiag);
        setConnectionState(CONNECTION_STATES.ONLINE);
        setIsChecking(false);
        setHasCompletedInitialCheck(true);
        isCheckingRef.current = false;
        return CONNECTION_STATES.ONLINE;
      } else {
        throw new Error(`Health check status ${response.status}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);

      const isAbort = err.name === "AbortError";
      const newDiag = {
        deviceOnline: true,
        serverAvailable: false,
        sessionValid: null,
        lastCheckedAt: new Date(),
        message: isAbort
          ? "HostelMate health check timed out."
          : "HostelMate backend server is currently unreachable.",
      };
      setDiagnosticData(newDiag);
      setConnectionState(CONNECTION_STATES.SERVER_UNAVAILABLE);
      setIsChecking(false);
      setHasCompletedInitialCheck(true);
      isCheckingRef.current = false;
      return CONNECTION_STATES.SERVER_UNAVAILABLE;
    }
  }, [connectionState]);

  // Initial startup connection check
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Event Listeners for browser online/offline events & decoupled API network error events
  useEffect(() => {
    const handleOnline = () => {
      // Perform ONE health check when device regains connectivity.
      // Never reloads page or loops.
      checkConnection(true);
    };

    const handleOffline = () => {
      setConnectionState(CONNECTION_STATES.OFFLINE);
      setDiagnosticData((prev) => ({
        ...prev,
        deviceOnline: false,
        serverAvailable: false,
        lastCheckedAt: new Date(),
        message: "Device internet connection lost.",
      }));
    };

    const handleApiNetworkError = () => {
      setConnectionState((prev) => {
        if (prev === CONNECTION_STATES.ONLINE) {
          return CONNECTION_STATES.SERVER_UNAVAILABLE;
        }
        return prev;
      });
      setDiagnosticData((prev) => ({
        ...prev,
        serverAvailable: false,
        lastCheckedAt: new Date(),
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("hostelmate:network-error", handleApiNetworkError);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("hostelmate:network-error", handleApiNetworkError);
    };
  }, [checkConnection]);

  const openDiagnostic = useCallback(() => setIsDiagnosticOpen(true), []);
  const closeDiagnostic = useCallback(() => setIsDiagnosticOpen(false), []);

  const value = {
    connectionState,
    isChecking,
    hasCompletedInitialCheck,
    diagnosticData,
    isDiagnosticOpen,
    openDiagnostic,
    closeDiagnostic,
    checkConnection,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}

export default ConnectionContext;
