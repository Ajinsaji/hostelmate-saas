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
            Revenue trends & executive performance
          </p>
        </div>

        <button
          onClick={() => toast.success("Exporting Mobile Analytics Report...")}
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

      {/* 3. 4 Executive KPI Cards */}
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
            <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Growth Index</span>
            <TrendingUp size={22} style={{ color: "#22C55E" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>+18.4%</div>
          <div style={{ fontSize: "12px", color: "#22C55E" }}>vs last period</div>
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
            <BedDouble size={22} style={{ color: "#22C55E" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>88.2%</div>
          <div style={{ fontSize: "12px", color: "#22C55E" }}>Peak occupancy</div>
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
            <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Profit Margin</span>
            <IndianRupee size={22} style={{ color: "#22C55E" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>42.6%</div>
          <div style={{ fontSize: "12px", color: "#22C55E" }}>Profitable</div>
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
            <span style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>Lifetime Val</span>
            <Users size={22} style={{ color: "#22C55E" }} />
          </div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF" }}>₹48.5k</div>
          <div style={{ fontSize: "12px", color: "#94A3B8" }}>Per resident</div>
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
      </div>
    </div>
  );
});

export default BusinessIntelligenceMobile;
