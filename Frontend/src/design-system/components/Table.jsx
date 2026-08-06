import React from "react";
import { useTheme } from "../ThemeProvider";

export function Table({ 
  headers = [], 
  children, 
  className = "" 
}) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <div 
      className={`hidden lg:block w-full overflow-x-auto rounded-2xl border ${className}`}
      style={{
        background: colors.background.card || "#131C2E",
        borderColor: colors.border.default || "#202B45",
        borderRadius: radius.lg || "16px",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead className="sticky top-0 z-10 backdrop-blur-md">
          <tr 
            style={{ 
              background: "#162032",
              borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
            }}
          >
            {headers.map((h, i) => (
              <th 
                key={i}
                style={{
                  padding: `${spacing.md || "16px"} ${spacing.lg || "20px"}`,
                  fontSize: typography.sizes.xs || "12px",
                  fontWeight: typography.weights.bold,
                  color: colors.text.secondary || "#94A3B8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#202B45]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, onClick, className = "" }) {
  const { colors } = useTheme();

  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-white/[0.03] even:bg-white/[0.015] ${className}`}
      style={{
        borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = "" }) {
  const { colors, spacing, typography } = useTheme();

  return (
    <td
      className={className}
      style={{
        padding: `${spacing.md || "16px"} ${spacing.lg || "20px"}`,
        fontSize: typography.sizes.sm || "14px",
        color: colors.text.primary || "#FFFFFF",
      }}
    >
      {children}
    </td>
  );
}

export default Table;
