import { Card } from "./Card";
import { useTheme } from "../ThemeProvider";

export function ChartCard({ title, children, action }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Card aria-label={`${title} chart`}>
      <div className="flex justify-between items-center" style={{ marginBottom: spacing.lg }}>
        <h3 
          style={{ 
            fontSize: typography.sizes.cardTitle, 
            fontWeight: typography.weights.semibold, 
            color: colors.text.primary 
          }}
        >
          {title}
        </h3>
        {action && (
          <div>{action}</div>
        )}
      </div>
      <div className="w-full relative">
        {/* The actual chart component will be injected here */}
        {children}
      </div>
    </Card>
  );
}
