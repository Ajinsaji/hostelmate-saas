import { useState, useEffect } from "react";
import { api } from "../../services/api";

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
    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/api/admin/hostels", {
          params: {
            page: 1,
            pageSize: 25,
            search: "",
            sortField: "createdAt",
            sortOrder: "desc",
          },
        });

        if (!mounted) return;

        const payload = res?.data;
        if (payload?.success === false) {
          throw new Error(payload?.message || "Failed to load hostels");
        }

        setState((prev) => ({
          ...prev,
          success: true,
          data: (payload?.hostels || payload?.data || []).map((h) => ({
            ...h,
            // Normalize API fields to match existing HostelsList expectations
            // HostelsList navigates using `row.id`, so always provide a stable id.
            id: h?.id ?? h?._id ?? h?.hostelId,
            name: h?.hostelName ?? h?.name,
            owner: h?.ownerName ?? h?.owner,
            plan: h?.planType ?? h?.plan,
            status: h?.subscriptionStatus ?? h?.status,
          })),
          pagination: payload?.pagination || prev.pagination,
          meta: payload?.meta || prev.meta,
          error: null,
        }));
      } catch (err) {
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          success: false,
          data: [],
          pagination: { total: 0, page: 1, pageSize: prev.pagination.pageSize },
          meta: { filters: {}, sorting: {} },
          error: err?.response?.data?.message || err?.message || "Failed to load hostels list",
        }));
      } finally {
        if (!mounted) return;
        setState((prev) => ({ ...prev, loading: false }));
      }
    })();

    return () => {
      mounted = false;
    };
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


