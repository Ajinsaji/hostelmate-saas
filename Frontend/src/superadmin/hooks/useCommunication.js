import { useState, useEffect } from "react";
import api from "../../utils/api";

export function useCommunication(hostelId, page = 1, limit = 50, filters = {}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommunications = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page,
          limit,
          ...(hostelId ? { hostelId } : {}),
          ...filters
        }).toString();
        
        const response = await api.get(`/admin/communications?${queryParams}`);
        if (response.data.success) {
          setData(response.data.communications);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch communications");
      } finally {
        setLoading(false);
      }
    };
    fetchCommunications();
  }, [hostelId, page, limit, JSON.stringify(filters)]);

  return { data, pagination, loading, error };
}

export default useCommunication;
