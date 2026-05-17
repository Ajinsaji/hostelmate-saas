import { useEffect, useRef } from "react";
import { subscribeGlobalRefresh, isSafeToRefresh } from "../utils/globalRefresh";

export default function useGlobalPolling(fetchFn, { interval = 9000, safeProps = {}, enabled = true } = {}) {
  const fetchFnRef = useRef(fetchFn);
  const safePropsRef = useRef(safeProps);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    safePropsRef.current = safeProps;
  }, [safeProps]);

  useEffect(() => {
    if (!enabled) return undefined;

    let mounted = true;

    const run = async (silent = false) => {
      if (!mounted || !isSafeToRefresh(safePropsRef.current)) return;
      try {
        await fetchFnRef.current();
      } catch (error) {
        if (!silent) {
          console.warn("Global polling error:", error?.message || error);
        }
      }
    };

    run();

    const intervalId = setInterval(() => {
      if (isSafeToRefresh(safePropsRef.current)) {
        run(true);
      }
    }, interval);

    const unsubscribe = subscribeGlobalRefresh(() => {
      if (isSafeToRefresh(safePropsRef.current)) {
        run(true);
      }
    });

    return () => {
      mounted = false;
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [enabled, interval]);
}
