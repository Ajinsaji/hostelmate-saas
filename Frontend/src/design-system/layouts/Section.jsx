import { spacing } from "../tokens/spacing";

export function Section({ children, className = "" }) {
  return (
    <section 
      className={`w-full ${className}`}
      style={{ marginBottom: spacing.lg }}
    >
      {children}
    </section>
  );
}
