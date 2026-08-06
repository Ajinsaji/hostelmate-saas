import React from "react";
import { useTheme } from "../ThemeProvider";

export function SkeletonLoader({ width = "100%", height = "20px", borderRadius = "12px", className = "" }) {
  const { colors } = useTheme();

  return (
    <div 
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: "rgba(255, 255, 255, 0.06)",
      }}
    />
  );
}

export function LoadingSkeleton(props) {
  return <SkeletonLoader {...props} />;
}

export function CardSkeleton() {
  const { colors } = useTheme();

  return (
    <div 
      className="w-full animate-pulse"
      style={{
        background: colors.background.card || "#131C2E",
        borderRadius: "16px",
        padding: "20px",
        border: `1px solid ${colors.border.default || "#202B45"}`,
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <SkeletonLoader width="40px" height="40px" borderRadius="10px" />
        <SkeletonLoader width="60px" height="20px" borderRadius="9999px" />
      </div>
      <SkeletonLoader width="40%" height="14px" className="mb-2" />
      <SkeletonLoader width="70%" height="24px" />
    </div>
  );
}

export default SkeletonLoader;
