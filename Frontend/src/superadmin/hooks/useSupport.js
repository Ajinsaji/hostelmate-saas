import { useState, useEffect } from "react";

export function useSupport(hostelId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Phase 1: removed mock usage. This page currently has no live backend contract in this repo snapshot.
    // Keep API contract stable by returning an empty list.
    if (!hostelId) setData([]);
  }, [hostelId]);

  return { data, loading, error };
}

export default useSupport;

