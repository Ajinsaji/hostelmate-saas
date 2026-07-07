import { useState, useEffect } from "react";
import auditMock from "../constants/mocks/audit.json";

export function useAudit(hostelId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(auditMock);
      } catch (err) {
        setError(err.message || "Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [hostelId]);

  return { data, loading, error };
}

export default useAudit;
