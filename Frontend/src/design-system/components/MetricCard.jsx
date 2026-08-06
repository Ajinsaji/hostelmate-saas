import React from "react";
import { Card } from "./Card";
import { useTheme } from "../ThemeProvider";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function MetricCard({ 
  title, 
  value, 
  subtext,
  trend, 
  trendDirection = "up", // up, down, neutral
  icon: Icon,
  badgeColor = "primary",
  onClick
}) {
  const { colors, spacing, typography } = useTheme();

  const getTrendBadge = () => {
    if (!trend) return null;
    const isUp = trendDirection === "up";
    const isDown = trendDirection === "down";

    const bgColor = isUp ? "rgba(34, 197, 94, 0.12)" : isDown ? "rgba(239, 68, 68, 0.12)" : "rgba(148, 163, 184, 0.12)";
    const textColor = isUp ? colors.accent.success : isDown ? colors.accent.danger : colors.text.secondary;
    const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "9999px",
          background: bgColor,
          color: textColor,
          fontSize: "11px",
          fontWeight: typography.weights.bold,
          lineHeight: 1,
        }}
      >
        <TrendIcon size={12} />
        <span>{trend}</span>
      </div>
    );
  };

  return (
    <Card 
      onClick={onClick}
      hover={!!onClick}
      aria-label={`${title} metric`}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        minHeight: "134px",
        padding: spacing.lg || "20px",
        background: "linear-gradient(180deg, rgba(19, 28, 46, 0.98) 0%, rgba(17, 25, 40, 0.96) 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
        <span style={{ fontSize: typography.sizes.xs || "12px", color: colors.text.secondary || "#94A3B8", fontWeight: typography.weights.medium }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(34, 197, 94, 0.1)",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.accent.primary || "#22C55E",
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ marginTop: "2px" }}>
        <div style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", lineHeight: 1.15 }}>
          {value}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", gap: "8px" }}>
          {getTrendBadge()}
          {subtext && (
            <span style={{ fontSize: "11px", color: colors.text.secondary || "#94A3B8" }}>
              {subtext}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default MetricCard;
