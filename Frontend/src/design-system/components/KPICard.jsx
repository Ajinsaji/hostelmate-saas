import React from "react";
import { Card } from "./Card";
import { useTheme } from "../ThemeProvider";
import { AlertTriangle, HelpCircle, Loader2 } from "lucide-react";

export function KPICard({ 
  title, 
  value, 
  trend, 
  trendDirection = "up", // up, down, neutral
  icon: Icon,
  tone = "primary",
  loading = false,
  error = null,
  empty = false
}) {
  const { colors, spacing, typography, radius } = useTheme();

  const getGradient = () => {
    switch(tone) {
      case "success": return colors.gradients.success;
      case "warning": return colors.gradients.warning;
      case "danger": return colors.gradients.danger;
      case "info": return colors.gradients.info;
      case "primary":
      default: return colors.gradients.ai;
    }
  };

  const getTrendColor = () => {
    if (trendDirection === "up") return colors.accent.success;
    if (trendDirection === "down") return colors.accent.danger;
    return colors.accent.warning;
  };

  if (loading) {
    return (
      <Card 
        style={{ 
          height: "100%", 
          minHeight: "140px", 
          borderRadius: radius.xxl, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm }}>
          <Loader2 className="animate-spin text-[#16A34A]" size={24} />
          <span style={{ fontSize: '11px', color: colors.text.muted, fontFamily: typography.fontFamily }}>Loading...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card 
        style={{ 
          height: "100%", 
          minHeight: "140px", 
          borderRadius: radius.xxl, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          borderColor: colors.accent.danger
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.xs, textAlign: 'center', padding: spacing.sm }}>
          <AlertTriangle size={20} style={{ color: colors.accent.danger }} />
          <span style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text.primary, fontFamily: typography.fontFamily }}>Error loading KPI</span>
          <span style={{ fontSize: '10px', color: colors.text.muted, fontFamily: typography.fontFamily }}>{error?.message || error}</span>
        </div>
      </Card>
    );
  }

  if (empty) {
    return (
      <Card 
        style={{ 
          height: "100%", 
          minHeight: "140px", 
          borderRadius: radius.xxl, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.xs, textAlign: 'center', padding: spacing.sm }}>
          <HelpCircle size={20} style={{ color: colors.text.muted }} />
          <span style={{ fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text.primary, fontFamily: typography.fontFamily }}>No records</span>
          <span style={{ fontSize: '10px', color: colors.text.muted, fontFamily: typography.fontFamily }}>{title}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      hover 
      className="flex flex-col justify-between" 
      style={{ 
        height: "100%", 
        minHeight: "140px", 
        borderRadius: radius.xxl,
        padding: spacing.xl,
        boxSizing: "border-box"
      }} 
      aria-label={`${title} KPI card`}
    >
      <div className="flex justify-between items-start">
        <div 
          className="rounded-full flex items-center justify-center"
          style={{
            background: getGradient(),
            width: "40px",
            height: "40px",
            color: colors.text.primary,
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
        
        {trend && (
          <div className="flex flex-col items-end">
            <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M0 20C10 20 15 4 25 4C35 4 45 16 50 16C55 16 58 10 60 10" stroke={getTrendColor()} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span 
              style={{
                color: getTrendColor(),
                fontSize: typography.sizes.label || '11px',
                fontWeight: typography.weights.bold,
                marginTop: spacing.xs,
                fontFamily: typography.fontFamily
              }}
            >
              {trendDirection === "up" ? "▲" : trendDirection === "down" ? "▼" : "•"} {trend}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: spacing.md }}>
        <p 
          style={{ 
            color: colors.text.secondary,
            fontSize: typography.sizes.body,
            fontFamily: typography.fontFamily,
            fontWeight: typography.weights.medium,
            margin: 0
          }}
        >
          {title}
        </p>
        <h3 
          style={{ 
            color: colors.text.primary,
            fontSize: typography.sizes.kpi || '28px',
            fontWeight: typography.weights.extrabold,
            lineHeight: 1.2,
            marginTop: spacing.xs,
            margin: `4px 0 0 0`,
            fontFamily: typography.fontFamily
          }}
        >
          {value}
        </h3>
      </div>
    </Card>
  );
}
