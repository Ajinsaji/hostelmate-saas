import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export function useFeatureGate() {
  const [gates, setGates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v2/workspaces/feature-gate");
      if (response.data && response.data.success) {
        setGates(response.data.gates);
      } else {
        throw new Error("Failed to load feature gates");
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching feature gates:", err);
      setError(err.message || "Failed to fetch feature gate limits");
      // Fallback defaults for safety
      setGates({
        hostels: { allowed: true, limit: 1, used: 1, remaining: 0, message: null },
        residents: { allowed: true, limit: 100, used: 0, remaining: 100, message: null },
        payroll: { allowed: false, limit: 0, used: 0, remaining: 0, message: "Upgrade to Pro" },
        ai: { allowed: false, limit: 0, used: 0, remaining: 0, message: "Upgrade to Pro" },
        reports: { allowed: false, limit: 0, used: 0, remaining: 0, message: "Upgrade to Pro" },
        analytics: { allowed: false, limit: 0, used: 0, remaining: 0, message: "Upgrade to Pro" },
        storage: { allowed: true, limit: 5368709120, used: 0, remaining: 5368709120, message: null },
        staff: { allowed: true, limit: 5, used: 0, remaining: 5, message: null },
        marketplace: { allowed: false, limit: 0, used: 0, remaining: 0, message: "Upgrade to Pro" },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGates();
    
    // Refresh whenever hostel changes
    window.addEventListener("hostelChanged", fetchGates);
    return () => {
      window.removeEventListener("hostelChanged", fetchGates);
    };
  }, [fetchGates]);

  return {
    gates,
    loading,
    error,
    refresh: fetchGates,
    canAddHostel: () => gates?.hostels || { allowed: false, limit: 0, used: 0, remaining: 0 },
    canAddResident: () => gates?.residents || { allowed: false, limit: 0, used: 0, remaining: 0 },
    canInviteStaff: () => gates?.staff || { allowed: false, limit: 0, used: 0, remaining: 0 },
    canUseAI: () => gates?.ai?.allowed || false,
    canUsePayroll: () => gates?.payroll?.allowed || false,
    canAccessAnalytics: () => gates?.analytics?.allowed || false,
    canExportReports: () => gates?.reports?.allowed || false,
    canAccessMarketplace: () => gates?.marketplace?.allowed || false,
  };
}
