import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { useAdminAutoRefresh } from "./useAdminAutoRefresh";

export function useDashboardStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    setEmpty(false);

    try {
      const res = await api.get("/api/admin/dashboard/overview");
      const payload = res?.data?.data ?? res?.data ?? {};

      if (!payload) {
        setEmpty(true);
        setData(null);
        return;
      }

      // Backward-compatible mapping for DashboardOverview StatCard props.
      const toKpi = (value, trend = "", direction = "neutral") => ({
        value: value ?? 0,
        trend,
        direction,
      });

      const isKpi = (obj) =>
        obj &&
        typeof obj === "object" &&
        "value" in obj &&
        "trend" in obj &&
        "direction" in obj;

      setData({
        activeHostels: isKpi(payload?.activeHostels)
          ? payload.activeHostels
          : toKpi(payload?.activeHostels),

        trialHostels: isKpi(payload?.trialHostels)
          ? payload.trialHostels
          : toKpi(payload?.trialHostels),

        expiredHostels: isKpi(payload?.expiredSubscriptions)
          ? payload.expiredSubscriptions
          : toKpi(payload?.expiredSubscriptions),

        pendingRequests: toKpi(0),

        activeOwners: isKpi(payload?.totalOwners)
          ? payload.totalOwners
          : toKpi(payload?.totalOwners),

        totalResidents: isKpi(payload?.totalResidents)
          ? payload.totalResidents
          : toKpi(payload?.totalResidents),

        dailyActiveOwners: toKpi(0),
        platformHealthScore: toKpi(0),

        // new exact API fields
        totalHostels: payload?.totalHostels ?? 0,
        activeHostelsVal: payload?.activeHostels ?? 0,
        paidHostels: payload?.paidHostels ?? 0,
        trialHostelsVal: payload?.trialHostels ?? 0,
        deletedHostels: payload?.deletedHostels ?? 0,
        pendingHostels: payload?.pendingHostels ?? 0,
        newHostelsToday: payload?.newHostelsToday ?? 0,
        newHostelsThisWeek: payload?.newHostelsThisWeek ?? 0,
        totalOwnersVal: payload?.totalOwners ?? 0,
        newOwnersToday: payload?.newOwnersToday ?? 0,
        newOwnersThisWeek: payload?.newOwnersThisWeek ?? 0,
        totalResidentsVal: payload?.totalResidents ?? 0,
        newResidentsToday: payload?.newResidentsToday ?? 0,
        newResidentsThisWeek: payload?.newResidentsThisWeek ?? 0,
        totalRooms: payload?.totalRooms ?? 0,
        occupiedRooms: payload?.occupiedRooms ?? 0,
        occupancyRate: payload?.occupancyRate ?? 0,
        monthlyRevenue: payload?.monthlyRevenue ?? 0,
        todayRevenue: payload?.todayRevenue ?? 0,
        pendingPayments: payload?.pendingPayments ?? 0,
        pendingApprovals: payload?.pendingApprovals ?? 0,
        expiredSubscriptions: payload?.expiredSubscriptions ?? 0,
        newSignupsThisMonth: payload?.newSignupsThisMonth ?? 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchData();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  // Automatic 30-second visibility-aware refetching
  useAdminAutoRefresh(fetchData, 30000);

  return {
    data,
    loading,
    error,
    empty,
    refetch: fetchData,
  };
}

export default useDashboardStats;



