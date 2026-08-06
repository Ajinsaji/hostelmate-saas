import React from "react";
import { Search } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export function Input({
  label,
  error,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  className = "",
  icon: Icon,
  required = false,
  ...props
}) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          style={{
            fontSize: typography.sizes.xs || "12px",
            fontWeight: typography.weights.bold,
            color: colors.text.secondary || "#94A3B8",
            fontFamily: typography.fontFamily,
          }}
        >
          {label} {required && <span style={{ color: colors.accent.danger }}>*</span>}
        </label>
      )}
      
      <div style={{ position: "relative", width: "100%" }}>
        {Icon && (
          <div
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.text.secondary || "#94A3B8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Icon size={18} />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            minHeight: "44px",
            background: colors.background.elevated || "#1A2438",
            border: `1px solid ${error ? colors.accent.danger : colors.border.default || "#202B45"}`,
            borderRadius: radius.md || "12px",
            color: colors.text.primary || "#FFFFFF",
            paddingLeft: Icon ? "42px" : (spacing.md || "16px"),
            paddingRight: spacing.md || "16px",
            fontSize: typography.sizes.sm || "14px",
            fontFamily: typography.fontFamily,
            outline: "none",
            transition: "border-color 150ms ease, box-shadow 150ms ease",
            cursor: disabled ? "not-allowed" : "text",
            opacity: disabled ? 0.6 : 1,
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = colors.accent.primary || "#22C55E";
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = colors.border.default || "#202B45";
          }}
          {...props}
        />
      </div>

      {error && (
        <span
          style={{
            fontSize: "11px",
            color: colors.accent.danger || "#EF4444",
            fontFamily: typography.fontFamily,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search...", className = "", onClear }) {
  return (
    <Input
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={Search}
      className={className}
    />
  );
}

export default Input;
