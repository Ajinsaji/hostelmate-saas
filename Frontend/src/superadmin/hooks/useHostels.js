import { useState, useEffect } from "react";
import hostelsMock from "../constants/mocks/hostels.json";

export function useHostels() {
  const [state, setState] = useState({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: 1,
      pageSize: 25,
    },
    meta: {
      filters: {},
      sorting: {},
    },
    loading: true,
    error: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const normalized = Array.isArray(hostelsMock) ? hostelsMock : [];

        setState((prev) => ({
          ...prev,
          success: true,
          data: normalized,
          pagination: {
            ...prev.pagination,
            total: normalized.length,
          },
          meta: {
            ...prev.meta,
            filters: {},
            sorting: {},
          },
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          success: false,
          data: [],
          pagination: { total: 0, page: 1, pageSize: prev.pagination.pageSize },
          meta: { filters: {}, sorting: {} },
          error: err?.message || "Failed to load hostels list",
        }));
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return {
    success: state.success,
    data: state.data,
    pagination: state.pagination,
    meta: state.meta,
    loading: state.loading,
    error: state.error,
  };
}

export default useHostels;

