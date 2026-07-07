import { useState, useEffect } from "react";
import financialsMock from "../constants/mocks/financials.json";

export function useFinancials(hostelId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(financialsMock);
      } catch (err) {
        setError(err.message || "Failed to load financials");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [hostelId]);

  return { data, loading, error };
}

export default useFinancials;
