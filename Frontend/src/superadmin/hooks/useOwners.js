import { useState, useEffect } from "react";
import { api } from "../../services/api";

export function useOwners(page = 1, limit = 50) {
  const [data, setData] = useState([page, limit]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchOwners = async () => {
      try {
        const response = await api.get(`/api/admin/owners?page=${page}&limit=${limit}`);
        if (mounted && response.data.success) {
          setData(response.data.data || [page, limit]);
          setPagination(response.data.pagination);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        console.error("Failed to load owners", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchOwners();
    return () => { mounted = false; };
  }, [page, limit]);

  return { data, loading, pagination };
}

export default useOwners;
