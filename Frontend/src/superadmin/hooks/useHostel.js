import { useState, useEffect } from "react";
import hostelDetailsMock from "../constants/mocks/hostelDetails.json";

export function useHostel(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // In the future this will fetch `/api/superadmin/hostels/${id}`
        setData({ ...hostelDetailsMock, id });
      } catch (err) {
        setError(err.message || "Failed to load hostel details");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [id]);

  return { data, loading, error };
}

export default useHostel;
