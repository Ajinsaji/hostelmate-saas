import { useEffect, useState } from "react";
import { api } from "../../services/api";

export function useFinancials(hostelId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (!hostelId) {
          setData(null);
          return;
        }

        const res = await api.get(`/api/admin/hostels/${hostelId}/financials`);
        if (!cancelled) setData(res?.data?.data ?? res?.data ?? null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message || err?.message || "Failed to load financials"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [hostelId]);

  return { data, loading, error };
}

export default useFinancials;

