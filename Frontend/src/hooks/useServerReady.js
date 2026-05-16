import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Hook to detect server availability
 * Polls backend health endpoint until it responds
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {object} { isReady: boolean, isChecking: boolean, error: string | null }
 */
export function useServerReady(maxRetries = 30, retryDelay = 1000) {
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let retryTimerId = null;
    let wakeUpTimerId = null;

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    // Secondary waiting state: surface it via error string so the wrapper can display it without UI redesign.
    // We keep isChecking=true; we only change what the hook reports.
    const waitingThresholdMs = 15000;

    const checkServer = async () => {
      try {
        if (!isMounted) return;

        setIsChecking(true);
        // Do not clear error immediately; preserve “waking up” message after the threshold.
        // setError(null);

        const response = await axios.get(`${apiUrl}/api/health`, {
          timeout: 5000,
        });

        if (response.status === 200) {
          if (!isMounted) return;
          setIsReady(true);
          setIsChecking(false);
          setRetryCount(0);
          setError(null);
          return;
        }

        // Non-200 is treated as failure.
        throw new Error(`Health check returned status ${response.status}`);
      } catch (err) {
        if (!isMounted) return;

        setIsChecking(true);

        setRetryCount((prev) => {
          const next = prev + 1;
          if (next >= maxRetries) {
            setError("Server is taking too long to respond. Please try again.");
            setIsChecking(false);
          }
          return next;
        });

        // If we've reached maxRetries, stop scheduling further attempts.
        // Note: isChecking becomes false when maxRetries is reached.
        // We still schedule here, but subsequent unmount/guard prevents further state updates.
        if (retryTimerId) clearTimeout(retryTimerId);
        retryTimerId = setTimeout(checkServer, retryDelay);
      }
    };

    // Wake-up state timer (no forced readiness dismissal)
    wakeUpTimerId = setTimeout(() => {
      if (!isMounted) return;
      if (!isReady) {
        setError("Server is waking up... Please keep this page open.");
      }
    }, waitingThresholdMs);

    // Kick off polling
    checkServer();

    return () => {
      isMounted = false;
      if (retryTimerId) clearTimeout(retryTimerId);
      if (wakeUpTimerId) clearTimeout(wakeUpTimerId);
    };
  }, [maxRetries, retryDelay, isReady]);

  return { isReady, isChecking, error };
}


/**
 * Alternative hook using simple fetch to test a specific endpoint
 * Useful if health endpoint doesn't exist
 */
export function useServerReadyFallback() {
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkServer = async () => {
      let attempts = 0;
      const maxAttempts = 20;

      const poll = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const response = await fetch(`${apiUrl}/`, {
            method: "GET",
            mode: "no-cors",
          });

          setIsReady(true);
          setIsChecking(false);
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 1500);
          } else {
            // Fallback: show app after max attempts
            console.warn("Server not responding, showing app anyway");
            setIsReady(true);
            setIsChecking(false);
          }
        }
      };

      poll();
    };

    checkServer();
  }, []);

  return { isReady, isChecking };
}
