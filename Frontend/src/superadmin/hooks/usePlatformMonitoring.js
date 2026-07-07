import { useState, useEffect } from "react";
import monitoringMock from "../constants/mocks/monitoring.json";

export function usePlatformMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(monitoringMock);
      } catch (err) {
        setError(err.message || "Failed to load platform telemetry metrics");
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
}

export default usePlatformMonitoring;
