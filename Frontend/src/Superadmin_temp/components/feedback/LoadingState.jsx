import React from "react";
import { COLORS } from "../../constants/theme";

export const LoadingState = React.memo(({
  message = "Loading Command Center...",
  fullPage = true
}) => {
  const containerStyle = fullPage 
    ? {
        position: "fixed",
        inset: 0,
        background: "rgba(11, 17, 32, 0.8)",
        backdropFilter: "blur(8px)",
        zIndex: 9999
      }
    : {
        position: "relative",
        padding: "48px 16px",
        width: "100%"
      };

  return (
    <div className={`flex flex-col items-center justify-center ${fullPage ? "" : "h-full"}`} style={containerStyle}>
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Pulsing ring outer */}
        <div 
          className="absolute inset-0 rounded-full border-4 opacity-25 animate-ping"
          style={{ borderColor: COLORS.primaryLight }}
        />
        {/* Spinning indicator inner */}
        <div 
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${COLORS.primaryLight} transparent transparent transparent` }}
        />
      </div>
      
      {message && (
        <p className="text-xs font-semibold mt-4 tracking-wider animate-pulse" style={{ color: COLORS.textSecondary }}>
          {message}
        </p>
      )}
    </div>
  );
});

export default LoadingState;
