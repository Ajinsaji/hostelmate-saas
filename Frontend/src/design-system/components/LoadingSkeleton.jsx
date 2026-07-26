import { colors } from "../tokens/colors";
import { radius } from "../tokens/radius";

export function LoadingSkeleton({ width = "100%", height = "20px", borderRadius = radius.sm, className = "" }) {
  return (
    <div 
      className={`animate-pulse ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: colors.border
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div 
      className="w-full animate-pulse"
      style={{
        background: colors.card,
        borderRadius: radius.lg,
        padding: "20px",
        border: `1px solid rgba(0,0,0,0.02)`
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <LoadingSkeleton width="40px" height="40px" borderRadius="50%" />
        <LoadingSkeleton width="60px" height="20px" />
      </div>
      <LoadingSkeleton width="40%" height="16px" className="mb-2" />
      <LoadingSkeleton width="70%" height="24px" />
    </div>
  );
}
