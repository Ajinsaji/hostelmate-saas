import React from "react";
import { useConnection, CONNECTION_STATES } from "../contexts/ConnectionContext";
import LoadingScreen from "./LoadingScreen";
import ConnectionErrorScreen from "./ConnectionErrorScreen";

/**
 * Wrapper component that manages startup readiness.
 * - Shows LoadingScreen while connection state is INITIALIZING
 * - Shows ConnectionErrorScreen if initial check detects OFFLINE or SERVER_UNAVAILABLE
 * - Dismisses full screen blocking UI once connection is ONLINE so children render cleanly
 */
function ServerLoadingWrapper({ children }) {
  const { connectionState, isChecking, hasCompletedInitialCheck } = useConnection();

  // 1. Startup phase: initial health check in progress
  if (!hasCompletedInitialCheck || connectionState === CONNECTION_STATES.INITIALIZING) {
    return <LoadingScreen />;
  }

  // 2. Startup failure: Device offline or HostelMate server unreachable on app boot
  if (
    connectionState === CONNECTION_STATES.OFFLINE ||
    connectionState === CONNECTION_STATES.SERVER_UNAVAILABLE
  ) {
    return <ConnectionErrorScreen />;
  }

  // 3. Operational phase: Connection is ONLINE (or error recovered)
  return <>{children}</>;
}

export default ServerLoadingWrapper;
