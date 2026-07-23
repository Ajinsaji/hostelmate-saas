import { useState, useEffect } from "react";
import api from "../../utils/api";

export function useAudit(hostelId, page = 1, limit = 50, filters = {}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page,
          limit,
          ...(hostelId ? { hostelId } : {}),
          ...filters
        }).toString();
        
        const response = await api.get(`/admin/audit?${queryParams}`);
        if (response.data.success) {
          setData(response.data.logs);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch audit logs");
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [hostelId, page, limit, JSON.stringify(filters)]);

  return { data, pagination, loading, error };
}

export default useAudit;
