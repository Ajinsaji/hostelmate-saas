import { useEffect, useState } from "react";
import {
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Users,
  DollarSign,
  Building,
  AlertTriangle,
  Download,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Section } from "../design-system/layouts/Section";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function BusinessIntelligence() {
  const { colors, radius } = useTheme();
  const [activeTab, setActiveTab] = useState("executive"); // executive, financial, occupancy, forecast, reports
  const [kpis, setKpis] = useState(null);
  const [forecasts, setForecasts] = useState(null);
  const [drillDownData, setDrillDownData] = useState(null);
  const [timeframe, setTimeframe] = useState("30d");
  const [loading, setLoading] = useState(false);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  useEffect(() => {
    fetchBIData();
  }, [timeframe]);

  const fetchBIData = async () => {
    setLoading(true);
    try {
      const [kpiRes, fcRes] = await Promise.all([
        api.get("/api/analytics/dashboard"),
        api.get(`/api/analytics/forecast?timeframe=${timeframe}`),
      ]);

      if (kpiRes.data.success) setKpis(kpiRes.data.kpis);
      if (fcRes.data.success) setForecasts(fcRes.data.forecasts);
    } catch (error) {
      toast.error("Unable to load business intelligence analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = async (type) => {
    try {
      const res = await api.get(`/api/analytics/drilldown?type=${type}`);
      if (res.data.success) {
        setDrillDownData({ type, items: res.data.drillDown || [] });
        setIsDrillDownOpen(true);
      }
    } catch (error) {
      toast.error("Failed to load drill down details");
    }
  };

  const downloadReport = (type, format) => {
    toast.success(`Exporting ${type} report as ${format.toUpperCase()}...`);
    window.open(`/api/reports/${type}?format=${format}`, "_blank");
  };

  // Mock Trend Chart Data
  const financialTrendData = [
    { month: "Jan", revenue: 140000, expenses: 62000, profit: 78000 },
    { month: "Feb", revenue: 155000, expenses: 68000, profit: 87000 },
    { month: "Mar", revenue: 160000, expenses: 71000, profit: 89000 },
    { month: "Apr", revenue: 172000, expenses: 73000, profit: 99000 },
    { month: "May", revenue: 168000, expenses: 69000, profit: 99000 },
    { month: "Jun", revenue: 185000, expenses: 75000, profit: 110000 },
  ];

  const costDistributionData = [
    { name: "Payroll", value: kpis?.payrollCost || 45000 },
    { name: "Food & Kitchen", value: kpis?.foodCost || 22000 },
    { name: "Utilities & Electricity", value: 14000 },
    { name: "Maintenance", value: 8500 },
    { name: "Procurement", value: 12500 },
  ];

  return (
    <PageContainer>
      {/* Top Header Actions (rendered inside container since they're unique inline selectors) */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: colors.text.muted }}>BI Analytics Panel</p>
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>Enterprise Intelligence & Projections</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
            style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}
          >
            <option value="30d">30 Days Horizon</option>
            <option value="90d">90 Days Horizon</option>
            <option value="365d">Full Year Horizon</option>
          </select>
          <button
            onClick={() => downloadReport("executive", "pdf")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all text-white shadow-lg shadow-emerald-500/10"
            style={{ backgroundColor: colors.accent.primary }}
          >
            <Download size={14} /> Executive PDF
          </button>
        </div>
      </div>

      {/* Executive Health Scorecard Banner */}
      <div 
        className="p-6 rounded-3xl border shadow-xl mb-6"
        style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div 
              className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 shadow-lg shrink-0"
              style={{ backgroundColor: colors.background.elevated, borderColor: colors.accent.primary }}
            >
              <span className="text-3xl font-black text-white">{kpis?.executiveScore || 92}</span>
              <span className="text-[10px] font-bold absolute bottom-2" style={{ color: colors.accent.primary }}>/ 100</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: colors.accent.primary, borderColor: 'rgba(22, 163, 74, 0.2)' }}
                >
                  <Sparkles size={12} /> Executive Health Index
                </span>
                <span className="text-xs text-slate-400">High Operational Efficiency</span>
              </div>
              <h2 className="text-2xl font-black text-white">Overall Operational Health: Optimal</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Weighted composite score combining occupancy rate ({kpis?.occupancyPct || 0}%), treasury liquidity, rent collection efficiency, and payroll margin stability.
              </p>
            </div>
          </div>

          {/* Quick Alert Summary */}
          {kpis?.triggeredAlerts?.length > 0 && (
            <div 
              className="p-3.5 border rounded-2xl flex items-center gap-3"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
            >
              <AlertTriangle size={20} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-400">Threshold Alert Triggered</p>
                <p className="text-[11px] text-slate-300">
                  {kpis.triggeredAlerts[0].metric} is {kpis.triggeredAlerts[0].condition} threshold ({kpis.triggeredAlerts[0].threshold})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Card 
          className="p-4 cursor-pointer hover:border-emerald-500/40 transition" 
          onClick={() => handleDrillDown("occupancy")}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Occupancy Rate</span>
            <Building size={16} style={{ color: colors.accent.primary }} />
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: colors.accent.primary }}>{kpis?.occupancyPct || 0}%</p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-0.5">
            <ChevronRight size={10} /> Click to drill down
          </p>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:border-blue-500/40 transition" 
          onClick={() => handleDrillDown("revenue")}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Monthly Revenue</span>
            <DollarSign size={16} style={{ color: colors.accent.info }} />
          </div>
          <p className="text-xl font-bold mt-2" style={{ color: colors.accent.info }}>₹{(kpis?.monthlyRevenue || 0).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-0.5">
            <ChevronRight size={10} /> Click to drill down
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Monthly Expenses</span>
            <TrendingUp size={16} style={{ color: colors.accent.danger }} />
          </div>
          <p className="text-xl font-bold mt-2" style={{ color: colors.accent.danger }}>₹{(kpis?.monthlyExpenses || 0).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-500 mt-1">MTD Outflows</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Net Operating Profit</span>
            <Activity size={16} style={{ color: colors.accent.success }} />
          </div>
          <p className="text-xl font-bold mt-2" style={{ color: colors.accent.success }}>₹{(kpis?.monthlyProfit || 0).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-500 mt-1">Margin: {kpis?.monthlyRevenue > 0 ? Math.round((kpis.monthlyProfit / kpis.monthlyRevenue) * 100) : 0}%</p>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:border-purple-500/40 transition" 
          onClick={() => handleDrillDown("payroll")}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Payroll Outflow</span>
            <Users size={16} style={{ color: colors.accent.ai }} />
          </div>
          <p className="text-xl font-bold mt-2" style={{ color: colors.accent.ai }}>₹{(kpis?.payrollCost || 0).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-0.5">
            <ChevronRight size={10} /> Click to drill down
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Treasury Liquidity</span>
            <ShieldCheck size={16} style={{ color: colors.accent.info }} />
          </div>
          <p className="text-xl font-bold mt-2" style={{ color: colors.accent.info }}>₹{((kpis?.bankBalance || 0) + (kpis?.cashBalance || 0)).toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-slate-500 mt-1">Bank + Cash</p>
        </Card>
      </div>

      {/* Tabs */}
      <div 
        className="flex items-center gap-2 border-b pb-3 mb-6 overflow-x-auto"
        style={{ borderColor: colors.border.default }}
      >
        {[
          { key: "executive", label: "Executive Overview" },
          { key: "financial", label: "Financial & Profitability" },
          { key: "forecast", label: `Predictive Forecasts (${timeframe})` },
          { key: "reports", label: "Report Center & Exports" }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition border"
            style={{
              backgroundColor: activeTab === tab.key ? 'rgba(22, 163, 74, 0.1)' : 'transparent',
              color: activeTab === tab.key ? colors.accent.primary : colors.text.muted,
              borderColor: activeTab === tab.key ? 'rgba(22, 163, 74, 0.3)' : 'transparent'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Executive Overview with Recharts */}
      {activeTab === "executive" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue vs Expense Area Chart */}
          <Card className="p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-1">Financial Trend (Revenue vs Expenses vs Profit)</h3>
            <p className="text-xs text-slate-400 mb-4">Historical 6-month performance metrics</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.default} />
                  <XAxis dataKey="month" stroke={colors.text.disabled} fontSize={11} />
                  <YAxis stroke={colors.text.disabled} fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: colors.background.elevated, borderColor: colors.border.default, borderRadius: radius.lg }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Cost Distribution Pie Chart */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-white mb-1">Operational Cost Structure</h3>
            <p className="text-xs text-slate-400 mb-4">Breakdown of current monthly expenditure</p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                    {costDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: colors.background.elevated, borderColor: colors.border.default, borderRadius: radius.lg }} />
                  <Legend wrapperStyle={{ fontSize: "11px", color: colors.text.secondary }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Financial & Profitability */}
      {activeTab === "financial" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5">
            <h4 className="font-bold text-white text-sm">Revenue Collection Rate</h4>
            <p className="text-2xl font-black text-emerald-400 mt-2">94.2%</p>
            <p className="text-xs text-slate-400 mt-1">₹{(kpis?.monthlyRevenue || 0).toLocaleString("en-IN")} collected out of ₹{((kpis?.monthlyRevenue || 0) * 1.06).toLocaleString("en-IN")} billed</p>
          </Card>

          <Card className="p-5">
            <h4 className="font-bold text-white text-sm">Operating Profit Margin</h4>
            <p className="text-2xl font-black text-blue-400 mt-2">
              {kpis?.monthlyRevenue > 0 ? Math.round((kpis.monthlyProfit / kpis.monthlyRevenue) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Healthy margin for hostel operations</p>
          </Card>

          <Card className="p-5">
            <h4 className="font-bold text-white text-sm">Bank vs Cash Ratio</h4>
            <p className="text-2xl font-black text-purple-400 mt-2">85% Bank</p>
            <p className="text-xs text-slate-400 mt-1">₹{(kpis?.bankBalance || 0).toLocaleString("en-IN")} Bank | ₹{(kpis?.cashBalance || 0).toLocaleString("en-IN")} Cash</p>
          </Card>
        </div>
      )}

      {/* TAB 3: Predictive Forecasting */}
      {activeTab === "forecast" && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Predictive Trend Series ({forecasts?.timeframe})</h3>
              <p className="text-xs text-slate-400">Exponential smoothing model projections (Model Accuracy: {forecasts?.forecastSeries?.[0]?.accuracyPercentage || 94.5}%)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forecasts?.forecastSeries?.map((fc, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl border space-y-2 text-xs"
                style={{ backgroundColor: colors.background.elevated, borderColor: colors.border.default }}
              >
                <div 
                  className="flex justify-between font-bold text-white text-sm border-b pb-2"
                  style={{ borderColor: colors.border.light }}
                >
                  <span>{fc.periodLabel}</span>
                  <span style={{ color: colors.accent.primary }}>{fc.occupancyPct}% Occupancy</span>
                </div>
                <div className="flex justify-between" style={{ color: colors.text.secondary }}>
                  <span>Projected Revenue:</span>
                  <span className="font-bold" style={{ color: colors.accent.info }}>₹{fc.projectedRevenue.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between" style={{ color: colors.text.secondary }}>
                  <span>Projected Expense:</span>
                  <span className="font-bold" style={{ color: colors.accent.danger }}>₹{fc.projectedExpense.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between" style={{ color: colors.text.secondary }}>
                  <span>Projected Payroll:</span>
                  <span className="font-bold" style={{ color: colors.accent.ai }}>₹{fc.projectedPayroll.toLocaleString("en-IN")}</span>
                </div>
                <div 
                  className="flex justify-between font-extrabold pt-2 border-t"
                  style={{ color: colors.accent.success, borderColor: colors.border.light }}
                >
                  <span>Projected Net Cash Flow:</span>
                  <span>₹{fc.projectedCashFlow.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: Reports & Exports */}
      {activeTab === "reports" && (
        <Card className="p-6">
          <h3 className="text-base font-bold text-white mb-2">Executive & Domain Report Center</h3>
          <p className="text-xs text-slate-400 mb-6">Select report type and format to download full analytics ledgers</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["executive", "financial", "occupancy", "payroll", "food", "vendors", "treasury"].map((rpt) => (
              <div 
                key={rpt} 
                className="p-4 rounded-2xl border"
                style={{ backgroundColor: colors.background.elevated, borderColor: colors.border.default }}
              >
                <h4 className="font-bold text-white text-sm capitalize">{rpt} Report</h4>
                <p className="text-[11px] text-slate-400 mb-3">Comprehensive {rpt} metrics</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadReport(rpt, "pdf")}
                    className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border w-1/2 hover:opacity-90"
                    style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: colors.accent.success, borderColor: 'rgba(34, 197, 94, 0.2)' }}
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => downloadReport(rpt, "csv")}
                    className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border w-1/2 hover:opacity-90"
                    style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: colors.accent.info, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                  >
                    CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Multi-Level Drill-Down Modal */}
      {isDrillDownOpen && drillDownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-2xl border rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: colors.background.primary, borderColor: colors.border.default }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold capitalize">Drill-Down Details: {drillDownData.type}</h3>
              <button 
                onClick={() => setIsDrillDownOpen(false)} 
                className="px-3 py-1 text-xs rounded-lg border"
                style={{ backgroundColor: colors.background.elevated, borderColor: colors.border.default, color: colors.text.muted }}
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {drillDownData.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-xl border flex justify-between items-center"
                  style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}
                >
                  <div>
                    <p className="font-bold text-white">{item.roomNumber ? `Room ${item.roomNumber}` : item.title || item.fullName || `Item #${idx + 1}`}</p>
                    <p className="text-slate-400 text-[11px]">{item.description || item.amountPaid ? `Paid: ₹${item.amountPaid}` : "Active Entity"}</p>
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: colors.accent.success, borderColor: 'rgba(22, 163, 74, 0.2)' }}
                  >
                    {item.status || "OK"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
