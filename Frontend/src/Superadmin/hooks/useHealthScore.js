import { useState, useEffect } from "react";
import healthScoreMock from "../constants/mocks/healthScore.json";

export function useHealthScore(hostelId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(healthScoreMock);
      } catch (err) {
        setError(err.message || "Failed to load health score data");
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [hostelId]);

  return { data, loading, error };
}

export default useHealthScore;
