import { useState, useEffect } from "react";
import analyticsMock from "../constants/mocks/analytics.json";
import csMock from "../constants/mocks/customerSuccess.json";

export function useCustomerHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData({
          ...analyticsMock,
          ...csMock
        });
      } catch (err) {
        setError(err.message || "Failed to load customer health metrics");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
}

export default useCustomerHealth;
