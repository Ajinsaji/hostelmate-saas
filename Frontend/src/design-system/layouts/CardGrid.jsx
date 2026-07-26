import { spacing } from "../tokens/spacing";

export function CardGrid({ children, columns = { sm: 1, md: 2, lg: 3 }, className = "" }) {
  // A simple grid that adjusts based on standard breakpoints
  const gridClasses = `grid gap-4 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${className}`;
  // Hardcoding the sm/md/lg classes for standard use cases.
  // Using Tailwind grid-cols since the setup uses Tailwind for layout.
  
  return (
    <div className={gridClasses} style={{ gap: spacing.md }}>
      {children}
    </div>
  );
}
