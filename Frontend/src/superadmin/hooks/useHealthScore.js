import { useState, useEffect } from "react";
import { api } from "../../services/api";

export function useHealthScore(hostelId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/api/admin/health-score");
        const payload = res?.data?.data ?? res?.data;

        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || err.message || "Failed to load health score" );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [hostelId]);

  return { data, loading, error };
}

export default useHealthScore;

