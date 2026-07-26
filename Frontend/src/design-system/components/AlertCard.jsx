import { Card } from "./Card";
import { StatusPill } from "./StatusPill";
import { colors } from "../tokens/colors";
import { spacing } from "../tokens/spacing";
import { typography } from "../tokens/typography";
import { AlertCircle, ArrowRight } from "lucide-react";

export function AlertCard({
  title,
  description,
  severity = "warning", // high, medium, low
  onClick,
}) {
  const getIconColor = () => {
    switch (severity) {
      case "high": return colors.danger;
      case "medium": return colors.warning;
      case "low": return colors.info;
      default: return colors.warning;
    }
  };

  const getPillTone = () => {
    switch (severity) {
      case "high": return "danger";
      case "medium": return "warning";
      case "low": return "info";
      default: return "warning";
    }
  };

  return (
    <Card hover onClick={onClick} className="flex gap-4 items-start cursor-pointer">
      <div 
        className="rounded-full p-2"
        style={{ background: `${getIconColor()}15`, color: getIconColor() }}
      >
        <AlertCircle size={24} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 
            style={{ 
              fontWeight: typography.weights.bold,
              fontSize: typography.sizes.cardTitle,
              color: colors.textPrimary
            }}
          >
            {title}
          </h4>
          <StatusPill tone={getPillTone()}>
            {severity.toUpperCase()}
          </StatusPill>
        </div>
        <p 
          style={{ 
            color: colors.textSecondary,
            fontSize: typography.sizes.body,
            marginTop: spacing.xs,
            lineHeight: 1.5
          }}
        >
          {description}
        </p>
        <div 
          className="flex items-center gap-1"
          style={{ 
            color: colors.primary, 
            fontSize: typography.sizes.body,
            fontWeight: typography.weights.semibold,
            marginTop: spacing.sm
          }}
        >
          View Details <ArrowRight size={16} />
        </div>
      </div>
    </Card>
  );
}
