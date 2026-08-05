import { spacing } from "../tokens/spacing";

export function PageContainer({ children, className = "" }) {
  return (
    <div 
      className={`w-full flex-1 min-w-0 overflow-hidden ${className}`}
      style={{ 
        padding: `0 ${spacing.lg}`,
        boxSizing: 'border-box'
      }}
    >
      {children}
    </div>
  );
}
