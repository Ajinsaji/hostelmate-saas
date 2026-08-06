import React, { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  BarChart2,
  Users,
  Download,
  ShieldCheck,
  BedDouble,
  IndianRupee
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { useTheme } from "../design-system/ThemeProvider";
import {
  Card,
  MetricCard,
  Button,
  Badge,
  Tabs,
  SkeletonLoader,
  SectionHeader
} from "../design-system/components";

const CHART_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#6C4CF5", "#06B6D4"];

export default function BusinessIntelligence() {
  const { colors, typography } = useTheme();
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
  }, [timeframe]);

  useEffect(() => {
    fetchBIData();
  }, [fetchBIData]);

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

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Pro+ Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
              Business Intelligence & Analytics
            </h1>
            <Badge variant="success" showDot={false}>Pro+ Only</Badge>
          </div>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: 0 }}>
            Executive revenue trends, growth benchmarks, and room occupancy heatmaps
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-bold bg-[#1A2438] text-white"
            style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
          >
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="365d">Full Year</option>
          </select>
          <Button variant="primary" icon={Download} onClick={() => toast.success("Exporting Pro+ Analytics Report...")}>
            Export Pro Report
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Growth Index"
          value="+18.4%"
          icon={TrendingUp}
          trend="vs last period"
          trendDirection="up"
        />
        <MetricCard
          title="Avg Occupancy Rate"
          value="88.2%"
          icon={BedDouble}
          trend="Peak"
          trendDirection="up"
        />
        <MetricCard
          title="Net Profit Margin"
          value="42.6%"
          icon={IndianRupee}
          trend="Profitable"
          trendDirection="up"
        />
        <MetricCard
          title="Resident Lifetime Value"
          value="₹48,500"
          icon={Users}
        />
      </div>

      {/* 3. Analytics Horizon Tabs */}
      <Tabs
        tabs={[
          { id: "revenue", label: "Revenue & Growth" },
          { id: "occupancy", label: "Occupancy Heatmap" },
          { id: "comparison", label: "Year-on-Year Comparison" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. Desktop Analytics Charts Workspace */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonLoader height="320px" />
          <SkeletonLoader height="320px" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Trend Area Chart */}
          <Card padding="lg">
            <SectionHeader title="Revenue & Expense Growth Trend" subtitle="Monthly cashflow performance (₹)" />
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202B45" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#131C2E", borderColor: "#202B45", borderRadius: "12px", color: "#FFFFFF" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#22C55E" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Occupancy Heatmap Bar Chart */}
          <Card padding="lg">
            <SectionHeader title="Occupancy Rate Trend (%)" subtitle="Monthly bed fill rates across buildings" />
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202B45" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#131C2E", borderColor: "#202B45", borderRadius: "12px", color: "#FFFFFF" }} />
                  <Bar dataKey="occupancy" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Distribution Pie Chart */}
          <Card padding="lg" className="lg:col-span-2">
            <SectionHeader title="Revenue Distribution Breakdown" subtitle="Source breakdown of incoming hostel payments" />
            <div className="h-64 w-full mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#131C2E", borderColor: "#202B45", borderRadius: "12px", color: "#FFFFFF" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      )}

    </div>
  );
}
