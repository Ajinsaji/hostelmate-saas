import { Card } from "./Card";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";
import { spacing } from "../tokens/spacing";

export function ChartCard({ title, children, action }) {
  return (
    <Card>
      <div className="flex justify-between items-center" style={{ marginBottom: spacing.lg }}>
        <h3 
          style={{ 
            fontSize: typography.sizes.cardTitle, 
            fontWeight: typography.weights.semibold, 
            color: colors.textPrimary 
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
