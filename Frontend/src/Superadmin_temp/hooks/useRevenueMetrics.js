import { useState, useEffect } from "react";
import financeMock from "../constants/mocks/finance.json";

export function useRevenueMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(financeMock);
      } catch (err) {
        setError(err.message || "Failed to load revenue metrics");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
}

export default useRevenueMetrics;
