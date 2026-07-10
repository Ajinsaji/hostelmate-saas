import { useState, useEffect } from "react";
import { api } from "../../services/api";

export function useOwner(ownerId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!ownerId) throw new Error("Hostel id missing");
        // Customer 360 uses useOwner(id) where id is hostelId
        const res = await api.get(`/api/admin/hostels/${ownerId}/owner`);
        if (!mounted) return;
        setData(res?.data?.data || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || "Failed to load owner profile");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ownerId]);

  return { data, loading, error };
}

export default useOwner;

