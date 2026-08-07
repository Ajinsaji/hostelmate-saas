import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import BusinessIntelligenceMobile from "./BusinessIntelligenceMobile";
import BusinessIntelligenceDesktop from "./BusinessIntelligenceDesktop";

export default function BusinessIntelligence() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("revenue");
  const [kpis, setKpis] = useState(null);
  const [timeframe, setTimeframe] = useState("30d");
  const [loading, setLoading] = useState(false);

  const fetchBIData = useCallback(async () => {
    setLoading(true);
    try {
      const kpiRes = await api.get("/api/analytics/dashboard");
      if (kpiRes.data?.success) setKpis(kpiRes.data.kpis);
    } catch (error) {
      console.warn("Unable to load business intelligence analytics", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBIData();
  }, [fetchBIData, timeframe]);

  const financialTrendData = [
    { month: "Jan", revenue: 140000, expenses: 62000, occupancy: 78 },
    { month: "Feb", revenue: 155000, expenses: 68000, occupancy: 82 },
    { month: "Mar", revenue: 160000, expenses: 71000, occupancy: 85 },
    { month: "Apr", revenue: 172000, expenses: 73000, occupancy: 90 },
    { month: "May", revenue: 168000, expenses: 69000, occupancy: 88 },
    { month: "Jun", revenue: 185000, expenses: 75000, occupancy: 94 },
  ];

  const categoryDistributionData = [
    { name: "Rent Income", value: 145000 },
    { name: "Food & Mess", value: 35000 },
    { name: "Amenities & Laundry", value: 12000 },
    { name: "Other Services", value: 8000 },
  ];

  if (isMobile) {
    return (
      <BusinessIntelligenceMobile
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        financialTrendData={financialTrendData}
        categoryDistributionData={categoryDistributionData}
      />
    );
  }

  return (
    <BusinessIntelligenceDesktop
      timeframe={timeframe}
      setTimeframe={setTimeframe}
      financialTrendData={financialTrendData}
      categoryDistributionData={categoryDistributionData}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      loading={loading}
      kpis={kpis}
    />
  );
}
