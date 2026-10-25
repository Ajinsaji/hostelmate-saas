import { spacing } from "../tokens/spacing";

export function PageContainer({
  children,
  className = "",
  title,
  subtitle,
  action,
  actions,
  style = {},
}) {
  const headerAction = action || actions;

  return (
    <div 
      className={`w-full flex-1 min-w-0 overflow-hidden ${className}`}
      style={{ 
        padding: `0 ${spacing.lg}`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {(title || headerAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-b border-slate-800 mb-6">
          <div>
            {title && (
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-3 shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
