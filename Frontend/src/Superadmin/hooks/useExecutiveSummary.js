import { useState, useEffect } from "react";
import dashboardMock from "../constants/mocks/dashboard.json";
import financeMock from "../constants/mocks/finance.json";
import monitoringMock from "../constants/mocks/monitoring.json";

export function useExecutiveSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      try {
        // Build summary dynamically from mock files to simulate AI/aggregate engines
        const summaryText = `Platform summary: Revenue increased by ${financeMock.mrr.trend}. ${dashboardMock.activeHostels.value} active hostels on platform. ${financeMock.pendingRenewals.value} are due this cycle. Platform health is at ${dashboardMock.platformHealthScore.value} with database utilization at ${monitoringMock.databaseUsage.percent}%.`;
        
        setData({
          summary: summaryText,
          raw: {
            revenueGrowth: financeMock.mrr.trend,
            activeHostels: dashboardMock.activeHostels.value,
            pendingRenewals: financeMock.pendingRenewals.value,
            healthScore: dashboardMock.platformHealthScore.value,
            dbUsage: monitoringMock.databaseUsage.percent
          }
        });
      } catch (err) {
        setError(err.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
}

export default useExecutiveSummary;
