import { useState, useEffect } from "react";
import { api } from "../../services/api";
import toast from "react-hot-toast";

export function useSupport(hostelId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hostelId) {
      setData([]);
      return;
    }

    const fetchTickets = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/admin/hostels/${hostelId}/support`);
        if (response.data.success) {
          setData(response.data.data || []);
        } else {
          setError("Failed to load tickets");
        }
      } catch (err) {
        setError(err.message);
        toast.error("Failed to load support history");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [hostelId]);

  return { data, loading, error };
}

export default useSupport;

