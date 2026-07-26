import { spacing } from "../tokens/spacing";

export function PageContainer({ children, className = "" }) {
  return (
    <div 
      className={`mx-auto w-full max-w-7xl ${className}`}
      style={{ padding: `0 ${spacing.lg}` }}
    >
      {children}
    </div>
  );
}
