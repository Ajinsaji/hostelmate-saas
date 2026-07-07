import React from "react";
import { COLORS } from "../../constants/theme";

export const AvatarGroup = React.memo(({
  avatars = [], // array of { src, name }
  max = 4,
  size = "md", // 'sm' | 'md' | 'lg'
  className = ""
}) => {
  const getDims = () => {
    switch (size) {
      case "sm": return "w-6 h-6 text-[10px]";
      case "lg": return "w-10 h-10 text-sm";
      case "md":
      default: return "w-8 h-8 text-xs";
    }
  };

  const dimsClass = getDims();
  const visibleAvatars = avatars.slice(0, max);
  const extraCount = avatars.length - max;

  return (
    <div className={`flex items-center -space-x-2.5 overflow-hidden ${className}`}>
      {visibleAvatars.map((av, idx) => (
        <div
          key={idx}
          className={`${dimsClass} rounded-full border-2 shrink-0 flex items-center justify-center font-bold select-none overflow-hidden`}
          style={{ 
            borderColor: COLORS.surface,
            background: COLORS.surfaceLight,
            color: COLORS.textMain
          }}
          title={av.name}
        >
          {av.src ? (
            <img 
              src={av.src} 
              alt={av.name} 
              className="w-full h-full object-cover" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span>{av.name ? av.name.charAt(0).toUpperCase() : "?"}</span>
          )}
        </div>
      ))}
      
      {extraCount > 0 && (
        <div
          className={`${dimsClass} rounded-full border-2 shrink-0 flex items-center justify-center font-bold select-none`}
          style={{
            borderColor: COLORS.surface,
            background: COLORS.primaryLight,
            color: COLORS.textMain
          }}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
});

export default AvatarGroup;
