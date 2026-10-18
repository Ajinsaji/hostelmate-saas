import { memo } from "react";
import {
  TrendingUp,
  BedDouble,
  IndianRupee,
  Users,
  Download
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
  ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";
import { useTheme } from "../design-system/ThemeProvider";

const CHART_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#EF4444"];

export const BusinessIntelligenceMobile = memo(function BusinessIntelligenceMobile({
  timeframe,
  setTimeframe,
  financialTrendData,
  categoryDistributionData,
  kpis,
}) {
  const { colors } = useTheme();

  const timeframes = [
    { id: "30d", label: "30 Days" },
    { id: "90d", label: "90 Days" },
    { id: "365d", label: "Full Year" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* 1. Header & Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Analytics
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Revenue and occupancy for the selected period
          </p>
        </div>

        <button
          onClick={() => toast.error("Analytics export is not available yet. No file was created.")}
          style={{
            background: "#22C55E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "14px",
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "44px",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <Download size={18} />
          <span>Export</span>
        </button>
      </div>

      {/* 2. Timeframe Filter Chips */}
      <div style={{ display: "flex", gap: "8px" }}>
        {timeframes.map((tf) => {
          const isSel = timeframe === tf.id;
          return (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              style={{
                background: isSel ? "#22C55E" : colors.background.card || "#131C2E",
                color: isSel ? "#FFFFFF" : colors.text.secondary || "#94A3B8",
                border: `1px solid ${isSel ? "#22C55E" : colors.border.default || "#202B45"}`,
                borderRadius: "9999px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: isSel ? 700 : 500,
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              {tf.label}
            </button>
          );
        })}
      </div>

      {/* 3. 4 Executive KPI Cards with real database counts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>{timeframe === "30d" ? "30-Day Collections" : timeframe === "90d" ? "90-Day Collections" : "365-Day Collections"}</span>
            <IndianRupee size={22} style={{ color: "#22C55E" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
            {kpis?.periodRevenue !== undefined ? `₹${Number(kpis.periodRevenue).toLocaleString("en-IN")}` : "Unavailable"}
          </div>
          <div style={{ fontSize: "12px", color: kpis?.periodRevenue > 0 ? "#22C55E" : "#94A3B8" }}>
            {kpis?.periodRevenue > 0 ? "Collections recorded" : "No collections recorded"}
          </div>
        </div>

        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Occupancy</span>
            <BedDouble size={22} style={{ color: "#3B82F6" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
            {kpis?.occupancyRate !== undefined ? `${kpis.occupancyRate}%` : "Unavailable"}
          </div>
          <div style={{ fontSize: "12px", color: "#3B82F6" }}>
            {kpis?.totalBeds !== undefined ? `${kpis.occupiedBeds ?? 0} / ${kpis.totalBeds} beds` : "Bed count unavailable"}
          </div>
        </div>

        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Net Cashflow</span>
            <TrendingUp size={22} style={{ color: (kpis?.netProfit || 0) >= 0 ? "#22C55E" : "#EF4444" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
            {kpis?.netProfit !== undefined ? `₹${Number(kpis.netProfit).toLocaleString("en-IN")}` : "Unavailable"}
          </div>
          <div style={{ fontSize: "12px", color: (kpis?.netProfit || 0) >= 0 ? "#22C55E" : "#EF4444" }}>
            {(kpis?.netProfit || 0) >= 0 ? "Surplus" : "Deficit"}
          </div>
        </div>

        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Residents</span>
            <Users size={22} style={{ color: "#F59E0B" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>
            {kpis?.totalResidents !== undefined ? `${kpis.totalResidents}` : "Unavailable"}
          </div>
          <div style={{ fontSize: "12px", color: "#94A3B8" }}>Active residents</div>
        </div>
      </div>

      {/* 4. Single-Column Chart 1: Revenue vs Expenses Trend */}
      <div
        style={{
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Revenue & Expense Growth</div>
        <div style={{ width: "100%", minHeight: "200px" }}>
          {financialTrendData && financialTrendData.length > 0 ? (
            <div style={{ width: "100%", height: "220px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#202B45" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#131C2E", borderColor: "#202B45", color: "#FFF" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="#22C55E" fillOpacity={0.2} name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "180px", textAlign: "center", padding: "16px", border: "1px dashed #202B45", borderRadius: "14px", color: "#94A3B8" }}>
              <TrendingUp size={28} style={{ color: "#475569", marginBottom: "8px" }} />
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>No Historical Trend</div>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Monthly trends appear as rent collections and expenses are logged.</div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Single-Column Chart 2: Revenue Distribution */}
      <div
        style={{
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Revenue Breakdown</div>
        <div style={{ width: "100%", minHeight: "180px" }}>
          {categoryDistributionData && categoryDistributionData.length > 0 ? (
            <div style={{ width: "100%", height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                    {categoryDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#131C2E", borderColor: "#202B45", color: "#FFF" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "160px", textAlign: "center", padding: "16px", border: "1px dashed #202B45", borderRadius: "14px", color: "#94A3B8" }}>
              <IndianRupee size={28} style={{ color: "#475569", marginBottom: "8px" }} />
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>No Breakdown Available</div>
              <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>Source distribution displays once payments are registered.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default BusinessIntelligenceMobile;
