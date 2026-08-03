import { Card } from "./Card";
import { StatusPill } from "./StatusPill";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export function AlertCard({
  title,
  description,
  severity = "warning", // high, medium, low
  onClick,
}) {
  const { colors, spacing, typography } = useTheme();

  const getIconColor = () => {
    switch (severity) {
      case "high": return colors.accent.danger;
      case "medium": return colors.accent.warning;
      case "low": return colors.accent.info;
      default: return colors.accent.warning;
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
    <Card hover onClick={onClick} className="flex gap-4 items-start cursor-pointer" aria-label={`Alert: ${title}`}>
      <div 
        className="rounded-full p-2"
        style={{ background: `${getIconColor()}15`, color: getIconColor() }}
        aria-hidden="true"
      >
        <AlertCircle size={24} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 
            style={{ 
              fontWeight: typography.weights.bold,
              fontSize: typography.sizes.cardTitle,
              color: colors.text.primary
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
            color: colors.text.secondary,
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
            color: colors.accent.primary, 
            fontSize: typography.sizes.body,
            fontWeight: typography.weights.semibold,
            marginTop: spacing.sm
          }}
        >
          View Details <ArrowRight size={16} aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
