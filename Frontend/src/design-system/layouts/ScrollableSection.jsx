import { spacing } from "../tokens/spacing";

export function ScrollableSection({ children, className = "" }) {
  return (
    <div 
      className={`flex overflow-x-auto hide-scrollbar w-full ${className}`}
      style={{ 
        gap: spacing.md, 
        paddingBottom: spacing.sm,
        // hide scrollbar cross-browser
        scrollbarWidth: "none",
        msOverflowStyle: "none"
      }}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  );
}
