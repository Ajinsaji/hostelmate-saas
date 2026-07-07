import React from "react";
import { COLORS, SHADOWS, GLASS_VARIABLES, RADIUS } from "../../constants/theme";

export const SaaSCard = React.memo(({ 
  children, 
  className = "", 
  onClick, 
  hoverable = true,
  style = {} 
}) => {
  const cardStyle = {
    background: COLORS.surfaceGlass,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.sm,
    backdropFilter: GLASS_VARIABLES.backdropFilter,
    WebkitBackdropFilter: GLASS_VARIABLES.webkitBackdropFilter,
    ...style
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden transition-all duration-300 ${
        onClick ? "cursor-pointer" : ""
      } ${
        hoverable ? "hover:-translate-y-1 hover:border-strong hover:shadow-md" : ""
      } ${className}`}
      style={cardStyle}
    >
      {/* Background glow hover layer */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(400px circle at 50% 0%, rgba(20, 241, 217, 0.08), transparent 60%)`
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
});

export default SaaSCard;
