import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

const UNIFIED_GATES = {
  hostels: { allowed: true, limit: "Unlimited", used: 1, remaining: "Unlimited", message: null },
  residents: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
  payroll: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
  ai: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
  reports: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
  analytics: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
  storage: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
  staff: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
  marketplace: { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null },
};

export function useFeatureGate() {
  const [gates, setGates] = useState(UNIFIED_GATES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v2/workspaces/feature-gate");
      if (response.data && response.data.success && response.data.gates) {
        setGates(response.data.gates);
      } else {
        setGates(UNIFIED_GATES);
      }
      setError(null);
    } catch (err) {
      setGates(UNIFIED_GATES);
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
    gates: gates || UNIFIED_GATES,
    loading,
    error,
    refresh: fetchGates,
    canAddHostel: () => gates?.hostels || { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited" },
    canAddResident: () => gates?.residents || { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited" },
    canInviteStaff: () => gates?.staff || { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited" },
    canUseAI: () => true,
    canUsePayroll: () => true,
    canAccessAnalytics: () => true,
    canExportReports: () => true,
    canAccessMarketplace: () => true,
  };
}
