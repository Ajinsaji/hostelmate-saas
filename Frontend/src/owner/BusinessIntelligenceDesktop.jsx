import { memo } from "react";
import {
  TrendingUp,
  Users,
  Download,
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

export const BusinessIntelligenceDesktop = memo(function BusinessIntelligenceDesktop({
  timeframe,
  setTimeframe,
  financialTrendData,
  categoryDistributionData,
  activeTab,
  setActiveTab,
  loading,
  kpis,
}) {
  const { colors, typography } = useTheme();

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
          <Button variant="secondary" icon={Download} onClick={() => toast.error("Analytics export is not available yet. No file was created.")}>
            Export unavailable
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Cards with real database counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
            title={`${timeframe === "30d" ? "30-Day" : timeframe === "90d" ? "90-Day" : "365-Day"} Collections`}
          value={kpis?.periodRevenue !== undefined ? `₹${Number(kpis.periodRevenue).toLocaleString("en-IN")}` : "Unavailable"}
          icon={IndianRupee}
          trend={kpis?.periodRevenue > 0 ? "Collections recorded" : "No collections recorded"}
          trendDirection={kpis?.periodRevenue > 0 ? "up" : "neutral"}
        />
        <MetricCard
          title="Occupancy Rate"
          value={kpis?.occupancyRate !== undefined ? `${kpis.occupancyRate}%` : "Unavailable"}
          icon={BedDouble}
          trend={kpis?.totalBeds ? `${kpis.occupiedBeds || 0} / ${kpis.totalBeds} beds` : "No beds configured"}
          trendDirection={kpis?.occupancyRate > 0 ? "up" : "neutral"}
        />
        <MetricCard
          title="Net Cashflow"
          value={kpis?.netProfit !== undefined ? `₹${Number(kpis.netProfit).toLocaleString("en-IN")}` : "Unavailable"}
          icon={TrendingUp}
          trend={kpis?.netProfit >= 0 ? "Operational surplus" : "Operational deficit"}
          trendDirection={kpis?.netProfit >= 0 ? "up" : "down"}
        />
        <MetricCard
          title="Active Residents"
          value={kpis?.totalResidents !== undefined ? `${kpis.totalResidents}` : "Unavailable"}
          icon={Users}
          trend={kpis?.totalResidents > 0 ? "Current residents" : "No active residents"}
          trendDirection="neutral"
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
            <SectionHeader title="Revenue & Expense Growth Trend" subtitle="Historical cashflow trend unavailable; the graph will populate when period aggregates exist." />
            <div className="h-64 w-full mt-4">
              {financialTrendData && financialTrendData.length > 0 ? (
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
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl border-[#202B45] text-slate-400">
                  <TrendingUp className="mx-auto text-slate-600 mb-2" size={32} />
                  <p className="text-sm font-bold text-white">No Historical Trend Recorded</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Multi-month revenue trajectories will display once consecutive billing periods are logged.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Occupancy Heatmap Bar Chart */}
          <Card padding="lg">
            <SectionHeader title="Occupancy Rate Trend (%)" subtitle="Monthly bed fill rates across buildings" />
            <div className="h-64 w-full mt-4">
              {financialTrendData && financialTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#202B45" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#131C2E", borderColor: "#202B45", borderRadius: "12px", color: "#FFFFFF" }} />
                    <Bar dataKey="occupancy" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl border-[#202B45] text-slate-400">
                  <BedDouble className="mx-auto text-slate-600 mb-2" size={32} />
                  <p className="text-sm font-bold text-white">No Historical Occupancy Data</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Occupancy timelines will populate as resident admissions and checkout records accumulate.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Category Distribution Pie Chart */}
          <Card padding="lg" className="lg:col-span-2">
            <SectionHeader title="Revenue Distribution Breakdown" subtitle="Source breakdown of incoming hostel payments" />
            <div className="h-64 w-full mt-4 flex items-center justify-center">
              {categoryDistributionData && categoryDistributionData.length > 0 ? (
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
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl border-[#202B45] text-slate-400">
                  <IndianRupee className="mx-auto text-slate-600 mb-2" size={32} />
                  <p className="text-sm font-bold text-white">No Cashflow Breakdown Available</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Revenue collections and operating expense distributions will appear as payments are recorded.
                  </p>
                </div>
              )}
            </div>
          </Card>

        </div>
      )}

    </div>
  );
});

export default BusinessIntelligenceDesktop;
