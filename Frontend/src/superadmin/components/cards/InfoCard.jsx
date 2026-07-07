import React from "react";
import SaaSCard from "./SaaSCard";
import { COLORS } from "../../constants/theme";

export const InfoCard = React.memo(({
  title,
  description,
  icon,
  variant = "info", // 'info' | 'success' | 'warning' | 'error'
  actions,
  className = ""
}) => {
  const getColors = () => {
    switch (variant) {
      case "success":
        return { text: COLORS.success, bg: COLORS.successBg, border: "rgba(5, 150, 105, 0.2)" };
      case "warning":
        return { text: COLORS.warning, bg: COLORS.warningBg, border: "rgba(217, 119, 6, 0.2)" };
      case "error":
        return { text: COLORS.error, bg: COLORS.errorBg, border: "rgba(220, 38, 38, 0.2)" };
      case "info":
      default:
        return { text: COLORS.info, bg: COLORS.infoBg, border: "rgba(59, 130, 246, 0.2)" };
    }
  };

  const currentColors = getColors();

  return (
    <SaaSCard 
      hoverable={false}
      style={{ borderColor: currentColors.border, background: currentColors.bg }}
      className={`p-5 flex gap-4 items-start border ${className}`}
    >
      {icon && (
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ 
            borderColor: currentColors.border, 
            background: "rgba(255,255,255,0.04)",
            color: currentColors.text
          }}
        >
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold mb-1" style={{ color: COLORS.textMain }}>
          {title}
        </h4>
        {description && (
          <p className="text-xs leading-relaxed" style={{ color: COLORS.textSecondary }}>
            {description}
          </p>
        )}
        {actions && <div className="mt-3 flex items-center gap-2">{actions}</div>}
      </div>
    </SaaSCard>
  );
});

export default InfoCard;
