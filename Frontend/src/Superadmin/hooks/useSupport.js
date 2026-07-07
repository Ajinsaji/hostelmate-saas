import { useState, useEffect } from "react";
import supportMock from "../constants/mocks/support.json";

export function useSupport(hostelId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(supportMock);
      } catch (err) {
        setError(err.message || "Failed to load support tickets");
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [hostelId]);

  return { data, loading, error };
}

export default useSupport;
