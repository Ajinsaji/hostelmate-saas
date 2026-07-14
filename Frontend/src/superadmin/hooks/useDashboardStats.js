import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";

export function useDashboardStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
      // UI expects: { value, trend, direction } per KPI.
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
        // KPIs consumed by DashboardOverview.jsx -> platformKpiCards -> <StatCard value={...} />
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

        // new exact API fields (optional for other pages)
        totalHostels: payload?.totalHostels ?? 0,
        paidHostels: payload?.paidHostels ?? 0,
        totalRooms: payload?.totalRooms ?? 0,
        occupiedRooms: payload?.occupiedRooms ?? 0,
        occupancyRate: payload?.occupancyRate ?? 0,
        monthlyRevenue: payload?.monthlyRevenue ?? 0,
        pendingPayments: payload?.pendingPayments ?? 0,
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

  return {
    data,
    loading,
    error,
    empty,
    refetch: fetchData,
  };
}

export default useDashboardStats;



