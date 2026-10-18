import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import BusinessIntelligenceMobile from "./BusinessIntelligenceMobile";
import BusinessIntelligenceDesktop from "./BusinessIntelligenceDesktop";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function BusinessIntelligence() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("revenue");
  const [kpis, setKpis] = useState(null);
  const [timeframe, setTimeframe] = useState("30d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBIData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the canonical supported v2 analytics route
      const kpiRes = await api.get("/api/v2/analytics/dashboard", { params: { timeframe } });
      if (kpiRes.data?.success) {
        setKpis(kpiRes.data);
      } else {
        setError("Unable to load analytics metrics from server");
      }
    } catch (err) {
      console.warn("Unable to load business intelligence analytics", err);
      setError(err?.response?.data?.message || "Business intelligence service is currently unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    const timer = setTimeout(fetchBIData, 0);
    return () => clearTimeout(timer);
  }, [fetchBIData]);

  // Derived real data: only show categories if actual non-zero revenue/expenses exist in the database
  const categoryDistributionData = useMemo(() => {
    if (!kpis) return [];
    const items = [];
    if (typeof kpis.periodRevenue === "number" && kpis.periodRevenue > 0) {
      items.push({ name: "Rent Collections", value: kpis.periodRevenue });
    }
    if (typeof kpis.periodExpenses === "number" && kpis.periodExpenses > 0) {
      items.push({ name: "Operating Expenses", value: kpis.periodExpenses });
    }
    return items;
  }, [kpis]);

  // Multi-month historical time series: empty until historical snapshots are aggregated
  // Never present hardcoded synthetic months/numbers as real data
  const financialTrendData = useMemo(() => {
    return [];
  }, []);

  if (error) {
    return (
      <div className="p-8 my-6 text-center bg-[#162032] border border-[#22304A] rounded-3xl text-slate-400 space-y-4 max-w-xl mx-auto">
        <AlertTriangle className="mx-auto text-amber-400" size={36} />
        <div>
          <h3 className="text-white font-bold text-base">Analytics Engine Unavailable</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchBIData}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCcw size={14} /> Retry Analytics Engine
        </button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <BusinessIntelligenceMobile
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        financialTrendData={financialTrendData}
        categoryDistributionData={categoryDistributionData}
        kpis={kpis}
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
