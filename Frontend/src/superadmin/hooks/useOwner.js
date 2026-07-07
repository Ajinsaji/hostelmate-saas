import { useState, useEffect } from "react";
import ownerProfileMock from "../constants/mocks/ownerProfile.json";

export function useOwner(ownerId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setData(ownerProfileMock);
      } catch (err) {
        setError(err.message || "Failed to load owner profile");
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [ownerId]);

  return { data, loading, error };
}

export default useOwner;
