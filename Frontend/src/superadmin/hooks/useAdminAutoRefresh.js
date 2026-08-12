import { useEffect, useRef } from "react";

/**
 * Custom hook for 30-second visibility-aware background polling.
 * - Polls every `intervalMs` (default 30,000ms) while tab is visible.
 * - Pauses polling when tab is hidden.
 * - Executes an immediate refetch when returning to the tab.
 * - Cleans up intervals & event listeners on unmount.
 *
 * @param {Function} refetchFn - Async or sync callback to refetch data.
 * @param {number} intervalMs - Polling interval in ms (default 30000).
 * @param {boolean} enabled - Whether polling is active (default true).
 */
export function useAdminAutoRefresh(refetchFn, intervalMs = 30000, enabled = true) {
  const refetchRef = useRef(refetchFn);

  useEffect(() => {
    refetchRef.current = refetchFn;
  }, [refetchFn]);

  useEffect(() => {
    if (!enabled || typeof refetchRef.current !== "function") return;

    let timerId = null;

    const executeRefetch = () => {
      if (document.visibilityState === "visible" && typeof refetchRef.current === "function") {
        refetchRef.current();
      }
    };

    const startTimer = () => {
      stopTimer();
      timerId = setInterval(executeRefetch, intervalMs);
    };

    const stopTimer = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became visible again -> refetch immediately and restart interval
        executeRefetch();
        startTimer();
      } else {
        // Tab hidden -> pause polling
        stopTimer();
      }
    };

    // Start initial timer if visible
    if (document.visibilityState === "visible") {
      startTimer();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, enabled]);
}

export default useAdminAutoRefresh;
