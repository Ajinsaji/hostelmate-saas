import { useState, useEffect } from "react";
import { api } from "../../services/api";

export function useDashboardStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/api/admin/dashboard/overview");
        if (!mounted) return;
        setData(res?.data?.data ?? res?.data ?? null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || "Failed to load dashboard stats");
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

export default useDashboardStats;


