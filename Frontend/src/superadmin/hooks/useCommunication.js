import { useState, useEffect } from "react";

export function useCommunication(hostelId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Phase 1: removed mock usage. This repo snapshot does not provide a live communication endpoint.
    // Keep API contract stable by returning an empty list.
    if (!hostelId) setData([]);
  }, [hostelId]);

  return { data, loading, error };
}

export default useCommunication;

