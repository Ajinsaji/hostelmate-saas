import { useState, useEffect } from "react";
import { api } from "../../services/api";

export function useRevenueMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/api/admin/dashboard/revenue");
        if (!mounted) return;

        const payload = res?.data?.data ?? res?.data ?? null;

        // Empty state: treat missing/empty payload as no data (without breaking existing UI)
        if (!payload || (typeof payload === "object" && Object.keys(payload).length === 0)) {
          setData(null);
          return;
        }

        setData(payload);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || "Failed to load revenue metrics");
        setData(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}

export default useRevenueMetrics;



