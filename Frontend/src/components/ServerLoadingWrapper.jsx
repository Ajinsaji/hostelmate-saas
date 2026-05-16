import { useServerReady } from "../hooks/useServerReady";
import LoadingScreen from "./LoadingScreen";

/**
 * Wrapper component that shows LoadingScreen while server is connecting
 * Automatically dismisses when server is ready
 */
function ServerLoadingWrapper({ children }) {
  const { isReady, isChecking } = useServerReady();

  // Keep current visual design: render LoadingScreen on initial server readiness check.
  // Note: the hook also provides an `error` string for wake-up/timeout, but LoadingScreen already owns the full UI.
  return (
    <>
      {isChecking && !isReady && <LoadingScreen />}
      {children}
    </>
  );
}

export default ServerLoadingWrapper;

