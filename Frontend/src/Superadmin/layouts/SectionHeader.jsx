import React from "react";
import { COLORS } from "../constants/theme";

export const SectionHeader = React.memo(({
  title,
  subtitle,
  actions,
  className = ""
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: COLORS.textMain }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
});

export default SectionHeader;
