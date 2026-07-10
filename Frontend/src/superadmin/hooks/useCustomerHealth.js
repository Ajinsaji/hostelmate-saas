import { useState, useEffect } from "react";
import { api } from "../../services/api";

export function useCustomerHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get("/api/admin/customer-health");
        const payload = res?.data?.data ?? res?.data;

        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || err.message || "Failed to load customer health metrics");
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
  }, []);

  return { data, loading, error };
}

export default useCustomerHealth;

