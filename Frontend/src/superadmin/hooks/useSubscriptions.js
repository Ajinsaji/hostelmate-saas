import { useEffect, useState } from "react";
import { api } from "../../services/api";

export function useSubscriptions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/admin/subscriptions");
        const payload = res?.data;

        const list = payload?.data ?? payload?.subscriptions ?? [];
        if (!cancelled) setData(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message || err?.message || "Failed to load subscriptions"
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
  }, []);

  return { data, loading, error };
}

export default useSubscriptions;

