import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { COLORS } from "../constants/theme";

export const GlobalSearch = React.memo(() => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const triggerCommandPalette = () => {
    // Dispatch Ctrl+K to trigger global listener
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    }));
  };

  return (
    <div className="relative hidden md:flex items-center w-64 lg:w-80 cursor-text" onClick={triggerCommandPalette}>
      <Search 
        size={16} 
        className="absolute left-3.5 pointer-events-none" 
        style={{ color: COLORS.textMuted }}
      />
      
      <div
        className="w-full text-xs font-semibold py-2.5 pl-10 pr-16 outline-none transition-all duration-200 rounded-xl border border-white/5 flex items-center hover:bg-white/10"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          color: COLORS.textMuted
        }}
      >
        Search console...
      </div>
      
      <span 
        className="absolute right-3 px-1.5 py-0.5 rounded border border-white/10 text-[9px] font-black select-none pointer-events-none"
        style={{ background: "rgba(255,255,255,0.02)", color: COLORS.textMuted }}
      >
        {isMac ? "⌘K" : "Ctrl+K"}
      </span>
    </div>
  );
});

export default GlobalSearch;
