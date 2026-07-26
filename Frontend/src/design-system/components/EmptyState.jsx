import { Card } from "./Card";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";
import { spacing } from "../tokens/spacing";

export function EmptyState({ title, message, action, icon: Icon }) {
  return (
    <Card className="flex flex-col items-center justify-center text-center" style={{ padding: "40px 20px" }}>
      {Icon && (
        <div 
          className="mb-4 rounded-full p-4"
          style={{ background: `${colors.border}`, color: colors.textSecondary }}
        >
          <Icon size={32} />
        </div>
      )}
      <h3 style={{ fontSize: typography.sizes.sectionHeader, fontWeight: typography.weights.semibold, color: colors.textPrimary }}>
        {title}
      </h3>
      <p style={{ color: colors.textSecondary, fontSize: typography.sizes.body, marginTop: spacing.xs, maxWidth: "300px" }}>
        {message}
      </p>
      {action && (
        <div style={{ marginTop: spacing.lg }}>
          {action}
        </div>
      )}
    </Card>
  );
}
