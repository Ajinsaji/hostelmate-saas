import React from "react";
import { COLORS } from "../constants/theme";

export const ContentContainer = React.memo(({
  children,
  className = ""
}) => {
  return (
    <div 
      className={`rounded-[26px] border border-white/5 p-6 shadow-sm overflow-hidden ${className}`}
      style={{ background: "rgba(23, 32, 51, 0.4)" }}
    >
      {children}
    </div>
  );
});

export default ContentContainer;
