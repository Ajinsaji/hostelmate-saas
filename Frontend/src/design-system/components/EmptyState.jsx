import React from "react";
import { Card } from "./Card";
import { useTheme } from "../ThemeProvider";
import { AlertTriangle, Inbox, WifiOff } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ title = "No data found", description, message, action, icon: Icon = Inbox }) {
  const { colors, spacing, typography } = useTheme();
  const textContent = description || message;

  return (
    <Card className="flex flex-col items-center justify-center text-center w-full" style={{ padding: "40px 20px", background: "linear-gradient(180deg, rgba(19, 28, 46, 0.98) 0%, rgba(15, 23, 42, 0.94) 100%)" }}>
      <div 
        className="mb-4 rounded-full p-4 flex items-center justify-center"
        style={{ 
          background: "rgba(34, 197, 94, 0.12)", 
          color: colors.accent.primary || "#22C55E",
          width: "56px",
          height: "56px",
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: typography.sizes.md || "16px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
        {title}
      </h3>

      {textContent && (
        <p style={{ color: colors.text.secondary || "#94A3B8", fontSize: typography.sizes.xs || "12px", marginTop: "6px", maxWidth: "320px", lineHeight: 1.55 }}>
          {textContent}
        </p>
      )}

      {action && (
        <div style={{ marginTop: spacing.md || "16px" }}>
          {React.isValidElement(action) ? (
            action
          ) : action.onClick ? (
            <Button onClick={action.onClick} variant="primary" size="sm">
              {action.label || "Action"}
            </Button>
          ) : null}
        </div>
      )}
    </Card>
  );
}

export function ErrorState({ title = "Something went wrong", description = "Failed to load data. Please retry.", onRetry }) {
  const { colors, spacing, typography } = useTheme();

  return (
    <Card className="flex flex-col items-center justify-center text-center w-full" style={{ padding: "32px 20px", borderColor: colors.accent.danger, background: "linear-gradient(180deg, rgba(24, 17, 17, 0.96) 0%, rgba(15, 23, 42, 0.96) 100%)" }}>
      <div 
        className="mb-3 rounded-full p-3 flex items-center justify-center"
        style={{ background: "rgba(239, 68, 68, 0.12)", color: colors.accent.danger }}
      >
        <AlertTriangle size={24} />
      </div>

      <h4 style={{ fontSize: typography.sizes.sm || "14px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
        {title}
      </h4>

      <p style={{ color: colors.text.secondary || "#94A3B8", fontSize: "12px", marginTop: "4px", maxWidth: "280px", lineHeight: 1.55 }}>
        {description}
      </p>

      {onRetry && (
        <div style={{ marginTop: spacing.md || "16px" }}>
          <Button onClick={onRetry} variant="secondary" size="sm">
            Retry Connection
          </Button>
        </div>
      )}
    </Card>
  );
}

export function OfflineState({ title = "You are currently offline", description = "Check your internet connection to refresh hostel data." }) {
  const { colors, typography } = useTheme();

  return (
    <div 
      className="p-3 rounded-xl flex items-center justify-center gap-2 border text-xs font-bold w-full"
      style={{
        background: "rgba(245, 158, 11, 0.1)",
        borderColor: "rgba(245, 158, 11, 0.3)",
        color: colors.accent.warning || "#F59E0B",
      }}
    >
      <WifiOff size={16} />
      <span>{title}: {description}</span>
    </div>
  );
}

export default EmptyState;
