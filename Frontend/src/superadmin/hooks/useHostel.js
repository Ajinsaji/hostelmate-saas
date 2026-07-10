import { useState, useEffect } from "react";
import { api } from "../../services/api";

export function useHostel(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!id) throw new Error("Hostel id missing");
        const res = await api.get(`/api/admin/hostels/${id}`);
        if (!mounted) return;
        setData(res?.data?.data || null);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || "Failed to load hostel details");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  return { data, loading, error };
}

export default useHostel;

