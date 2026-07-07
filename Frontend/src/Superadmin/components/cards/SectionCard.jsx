import React from "react";
import SaaSCard from "./SaaSCard";
import { COLORS } from "../../constants/theme";

export const SectionCard = React.memo(({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "p-6"
}) => {
  return (
    <SaaSCard hoverable={false} className={`flex flex-col ${className}`}>
      {/* Card Header */}
      <div 
        className="px-6 py-5 flex items-center justify-between border-b"
        style={{ borderColor: COLORS.border }}
      >
        <div>
          <h3 className="text-base font-bold" style={{ color: COLORS.textMain }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Card Body */}
      <div className={bodyClassName}>
        {children}
      </div>
    </SaaSCard>
  );
});

export default SectionCard;
