import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useAdminAutoRefresh } from "./useAdminAutoRefresh";

export function useHostels(params = {}) {
  const [state, setState] = useState({
    success: true,
    data: [],
    pagination: {
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 25,
      totalPages: 1
    },
    meta: {
      filters: {},
      sorting: {},
    },
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setState(prev => ({ ...prev, loading: prev.data.length === 0 }));
    }

    try {
      const res = await api.get("/api/admin/hostels", {
        params: {
          page: params.page || 1,
          pageSize: params.pageSize || 25,
          search: params.search || "",
          sortField: params.sortField || "createdAt",
          sortOrder: params.sortOrder || "desc",
          ...params.filters
        },
      });

      const payload = res?.data;
      if (payload?.success === false) {
        throw new Error(payload?.message || "Failed to load hostels");
      }

      setState((prev) => ({
        ...prev,
        success: true,
        data: (payload?.hostels || payload?.data || []).map((h) => ({
          ...h,
          id: h?.id ?? h?._id ?? h?.hostelId,
          name: h?.hostelName ?? h?.name,
          owner: h?.ownerName ?? h?.owner,
          plan: h?.planType ?? h?.plan,
          status: h?.subscriptionStatus ?? h?.status,
        })),
        pagination: payload?.pagination || prev.pagination,
        meta: payload?.meta || prev.meta,
        error: null,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        success: false,
        data: isSilent ? prev.data : [],
        pagination: isSilent ? prev.pagination : { total: 0, page: 1, pageSize: prev.pagination.pageSize },
        meta: { filters: {}, sorting: {} },
        error: err?.response?.data?.message || err?.message || "Failed to load hostels list",
        loading: false,
      }));
    }
  }, [params.page, params.pageSize, params.search, params.sortField, params.sortOrder, JSON.stringify(params.filters)]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchData(false);
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  // 30-second silent background polling
  const silentRefetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  useAdminAutoRefresh(silentRefetch, 30000);

  return {
    success: state.success,
    data: state.data,
    pagination: state.pagination,
    meta: state.meta,
    loading: state.loading,
    error: state.error,
    refetch: silentRefetch,
  };
}

export default useHostels;


