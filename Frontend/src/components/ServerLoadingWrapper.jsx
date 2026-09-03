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
  const { connectionState, hasCompletedInitialCheck } = useConnection();
  const [videoEnded, setVideoEnded] = React.useState(false);

  const isNetworkLoading = !hasCompletedInitialCheck || connectionState === CONNECTION_STATES.INITIALIZING;

  // 2. Startup failure: Device offline or HostelMate server unreachable on app boot
  if (
    connectionState === CONNECTION_STATES.OFFLINE ||
    connectionState === CONNECTION_STATES.SERVER_UNAVAILABLE
  ) {
    return <ConnectionErrorScreen />;
  }

  // We show the Splash/Loading Screen if the network is still checking OR the video is still playing
  const showSplash = isNetworkLoading || !videoEnded;

  return (
    <>
      {/*
        Operational phase: Mount children as soon as the initial network check finishes.
        This allows authentication to bootstrap in the background while the video plays!
      */}
      {!isNetworkLoading && children}

      {/*
        Startup phase: Keep the loading/splash overlay active until BOTH network and video are done.
      */}
      {showSplash && (
        <LoadingScreen
          onVideoEnded={() => setVideoEnded(true)}
          isNetworkLoading={isNetworkLoading}
        />
      )}
    </>
  );
}

export default ServerLoadingWrapper;
