import { useState, useEffect } from "react";
import communicationsMock from "../constants/mocks/communications.json";

export function useCommunication(hostelId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(communicationsMock);
      } catch (err) {
        setError(err.message || "Failed to load communications timeline");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [hostelId]);

  return { data, loading, error };
}

export default useCommunication;
