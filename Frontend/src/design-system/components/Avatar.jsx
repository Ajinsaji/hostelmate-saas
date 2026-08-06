import React from "react";
import { useTheme } from "../ThemeProvider";

export function Avatar({ 
  src, 
  name = "User", 
  size = "md",
  className = "" 
}) {
  const { colors, typography } = useTheme();

  const dimensions = {
    sm: "32px",
    md: "40px",
    lg: "48px",
    xl: "64px",
  };

  const fontSizes = {
    sm: "12px",
    md: "14px",
    lg: "16px",
    xl: "22px",
  };

  const dim = dimensions[size] || dimensions.md;
  const fSize = fontSizes[size] || fontSizes.md;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: dim,
        height: dim,
        borderRadius: "9999px",
        background: colors.background.elevated || "#1A2438",
        border: `1px solid ${colors.border.default || "#202B45"}`,
        color: colors.text.primary || "#FFFFFF",
        fontWeight: typography.weights.bold,
        fontSize: fSize,
        fontFamily: typography.fontFamily,
      }}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
