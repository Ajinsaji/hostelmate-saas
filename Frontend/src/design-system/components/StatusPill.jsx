import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";
import { typography } from "../tokens/typography";

export function StatusPill({ children, tone = "neutral", className = "" }) {
  const getStyles = () => {
    switch (tone) {
      case "success":
        return { bg: `${colors.success}26`, text: colors.success }; // 26 hex is ~15% opacity
      case "warning":
        return { bg: `${colors.warning}26`, text: colors.warning };
      case "danger":
        return { bg: `${colors.danger}26`, text: colors.danger };
      case "info":
        return { bg: `${colors.info}26`, text: colors.info };
      case "neutral":
      default:
        return { bg: colors.border, text: colors.textSecondary };
    }
  };

  const styles = getStyles();

  return (
    <span 
      className={`inline-flex items-center justify-center font-medium ${className}`}
      style={{
        background: styles.bg,
        color: styles.text,
        borderRadius: radius.pill,
        padding: "4px 12px",
        fontSize: typography.sizes.label,
        fontFamily: typography.fontFamily,
      }}
    >
      {children}
    </span>
  );
}
