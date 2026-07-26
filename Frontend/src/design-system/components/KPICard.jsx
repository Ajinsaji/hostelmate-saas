import { Card } from "./Card";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";
import { spacing } from "../tokens/spacing";

export function KPICard({ 
  title, 
  value, 
  trend, 
  trendDirection = "up", // up, down, neutral
  icon: Icon,
  tone = "primary"
}) {
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
    if (trendDirection === "up") return colors.success;
    if (trendDirection === "down") return colors.danger;
    return colors.warning;
  };

  return (
    <Card hover className="flex flex-col justify-between" style={{ minHeight: "140px" }}>
      <div className="flex justify-between items-start">
        <div 
          className="rounded-full flex items-center justify-center text-white"
          style={{
            background: getGradient(),
            width: "40px",
            height: "40px",
          }}
        >
          {Icon && <Icon size={20} />}
        </div>
        
        {trend && (
          <div className="flex flex-col items-end">
            {/* Placeholder for Sparkline - implement with a tiny chart library later if needed */}
            <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 20C10 20 15 4 25 4C35 4 45 16 50 16C55 16 58 10 60 10" stroke={getTrendColor()} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span 
              style={{
                color: getTrendColor(),
                fontSize: typography.sizes.label,
                fontWeight: typography.weights.bold,
                marginTop: spacing.xs
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
            color: colors.textSecondary,
            fontSize: typography.sizes.body,
            fontFamily: typography.fontFamily,
            fontWeight: typography.weights.medium
          }}
        >
          {title}
        </p>
        <h3 
          style={{ 
            color: colors.textPrimary,
            fontSize: typography.sizes.kpi,
            fontWeight: typography.weights.extrabold,
            lineHeight: 1.2,
            marginTop: spacing.xs
          }}
        >
          {value}
        </h3>
      </div>
    </Card>
  );
}
