import React from "react";
import { Card } from "./Card";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";
import { spacing } from "../tokens/spacing";

export function EmptyState({ title, message, description, action, icon: Icon }) {
  const renderAction = () => {
    if (!action) return null;
    if (React.isValidElement(action) || typeof action === "string" || typeof action === "number") {
      return action;
    }
    if (typeof action === "object" && action.onClick) {
      return (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-full px-4 py-2 text-sm font-semibold cursor-pointer transition active:scale-95"
          style={{
            background: colors.primary,
            color: "#031018",
            border: "none",
          }}
        >
          {action.label || "Action"}
        </button>
      );
    }
    return null;
  };

  const textContent = description || message;

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
      {textContent && (
        <p style={{ color: colors.textSecondary, fontSize: typography.sizes.body, marginTop: spacing.xs, maxWidth: "340px" }}>
          {textContent}
        </p>
      )}
      {action && (
        <div style={{ marginTop: spacing.lg }}>
          {renderAction()}
        </div>
      )}
    </Card>
  );
}
