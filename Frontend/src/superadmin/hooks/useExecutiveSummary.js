import { useEffect, useState } from "react";
import { api } from "../../services/api";

export function useExecutiveSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/api/admin/dashboard/executive-summary");
        if (!mounted) return;

        // Preserve hook contract: {summary, ...} payload shape is expected by DashboardOverview
        setData(res?.data?.data ?? res?.data ?? null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load executive summary");
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

export default useExecutiveSummary;

