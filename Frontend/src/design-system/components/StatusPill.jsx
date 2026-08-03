import { useTheme } from "../ThemeProvider";

export function StatusPill({ children, tone = "neutral", className = "" }) {
  const { colors, radius, typography } = useTheme();

  const getStyles = () => {
    switch (tone) {
      case "success":
        return { bg: `${colors.accent.success}26`, text: colors.accent.success }; // 26 hex is ~15% opacity
      case "warning":
        return { bg: `${colors.accent.warning}26`, text: colors.accent.warning };
      case "danger":
        return { bg: `${colors.accent.danger}26`, text: colors.accent.danger };
      case "info":
        return { bg: `${colors.accent.info}26`, text: colors.accent.info };
      case "neutral":
      default:
        return { bg: colors.border.default, text: colors.text.secondary };
    }
  };

  const styles = getStyles();

  return (
    <span 
      className={`inline-flex items-center justify-center font-medium ${className}`}
      role="status"
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
