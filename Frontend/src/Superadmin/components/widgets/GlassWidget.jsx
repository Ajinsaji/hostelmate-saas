import React from "react";

export const GlassWidget = React.memo(({ 
  children, 
  className = "", 
  style = {} 
}) => {
  return (
    <div
      className={`border border-white/10 bg-slate-900/60 backdrop-blur-xl rounded-[26px] p-6 shadow-glass transition-all duration-300 hover:border-white/20 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
});

export default GlassWidget;
