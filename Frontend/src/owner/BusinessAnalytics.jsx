import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart2,
  Users,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { useCurrentHostel } from "../contexts/HostelContext";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { KPICard } from "../design-system/components/KPICard";
import { StatusPill } from "../design-system/components/StatusPill";

export default function BusinessAnalytics() {
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [residentData, setResidentData] = useState(null);
  const [activeTab, setActiveTab] = useState("revenue"); // revenue | occupancy | finance | residents

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [revRes, occRes, finRes, resRes] = await Promise.all([
        api.get("/api/v2/analytics/revenue"),
        api.get("/api/v2/analytics/occupancy"),
        api.get("/api/v2/analytics/finance"),
        api.get("/api/v2/analytics/residents")
      ]);

      if (revRes.data?.success) setRevenueData(revRes.data);
      if (occRes.data?.success) setOccupancyData(occRes.data);
      if (finRes.data?.success) setFinanceData(finRes.data);
      if (resRes.data?.success) setResidentData(resRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load business analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnalytics();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeHostelId]);

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <TrendingUp className="text-emerald-400" /> Business Analytics & Intelligence
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Multi-dimensional revenue forecasting, occupancy heatmaps, and financial analytics.
            </p>
          </div>
          <StatusPill tone="success">Live Insights</StatusPill>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#22304A] text-xs font-bold gap-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("revenue")}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "revenue" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Revenue Analytics
          </button>
          <button
            onClick={() => setActiveTab("occupancy")}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "occupancy" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Occupancy & Heatmap
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "finance" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Financial P&L
          </button>
          <button
            onClick={() => setActiveTab("residents")}
            className={`pb-3 border-b-2 transition whitespace-nowrap ${activeTab === "residents" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Resident Growth
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading analytics intelligence...
          </div>
        ) : (
          <>
            {/* REVENUE TAB */}
            {activeTab === "revenue" && revenueData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Revenue</span>
                    <div className="text-2xl font-black text-white mt-1">₹{revenueData.today?.toLocaleString()}</div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-bold">
                      <ArrowUpRight size={12} /> +4.2% vs yesterday
                    </span>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Weekly Revenue</span>
                    <div className="text-2xl font-black text-white mt-1">₹{revenueData.week?.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Revenue</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">₹{revenueData.month?.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Yearly Run-rate</span>
                    <div className="text-2xl font-black text-blue-400 mt-1">₹{revenueData.year?.toLocaleString()}</div>
                  </div>
                </div>

                <Card className="bg-[#162032] border-[#22304A]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart2 className="text-emerald-400" size={16} /> Monthly Revenue Trend Bar Visualization
                  </h3>
                  <div className="space-y-3">
                    {revenueData.monthlyTrend?.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span>{item.month}</span>
                          <span>₹{item.revenue.toLocaleString()} (Exp: ₹{item.expenses.toLocaleString()})</span>
                        </div>
                        <div className="w-full bg-[#0B1120] rounded-full h-3 overflow-hidden border border-[#22304A] flex">
                          <div className="bg-emerald-500 h-full" style={{ width: `${(item.revenue / 80000) * 100}%` }} />
                          <div className="bg-rose-500/60 h-full" style={{ width: `${(item.expenses / 80000) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* OCCUPANCY TAB */}
            {activeTab === "occupancy" && occupancyData && (
              <div className="space-y-6">
                <div className="bg-[#162032] border border-[#22304A] p-6 rounded-3xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Current Workspace Occupancy Rate</span>
                    <div className="text-4xl font-black text-emerald-400 mt-1">{occupancyData.currentOccupancy}%</div>
                  </div>
                  <StatusPill tone="success">Optimal Capacity</StatusPill>
                </div>

                <Card className="bg-[#162032] border-[#22304A]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Day of Week Occupancy Heatmap</h3>
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {occupancyData.heatmap?.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-400 block">{item.day}</span>
                        <span className="text-lg font-black text-emerald-400 mt-1 block">{item.rate}%</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* FINANCE TAB */}
            {activeTab === "finance" && financeData && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Income</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">₹{financeData.income?.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Expenses</span>
                    <div className="text-2xl font-black text-rose-400 mt-1">₹{financeData.expenses?.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Net Profit</span>
                    <div className="text-2xl font-black text-teal-400 mt-1">₹{financeData.profit?.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Dues</span>
                    <div className="text-2xl font-black text-amber-400 mt-1">₹{financeData.pendingRent?.toLocaleString()}</div>
                  </div>
                </div>

                <Card className="bg-[#162032] border-[#22304A]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Financial Breakdown</h3>
                  <div className="space-y-2 text-xs">
                    {financeData.breakdown?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-[#0B1120] border border-[#22304A] rounded-xl">
                        <span className="font-bold text-white">{item.category}</span>
                        <span className="font-mono font-bold text-emerald-400">₹{item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* RESIDENTS TAB */}
            {activeTab === "residents" && residentData && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Admissions (MTD)</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">+{residentData.admissionsThisMonth}</div>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Exits (MTD)</span>
                    <div className="text-2xl font-black text-rose-400 mt-1">-{residentData.exitsThisMonth}</div>
                  </div>
                  <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Net Resident Growth</span>
                    <div className="text-2xl font-black text-blue-400 mt-1">+{residentData.netGrowth}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
