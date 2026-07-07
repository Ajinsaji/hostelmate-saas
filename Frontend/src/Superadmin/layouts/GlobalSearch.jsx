import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { COLORS } from "../constants/theme";

export const GlobalSearch = React.memo(() => {
  const [query, setQuery] = useState("");
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("saas-global-search-input");
        if (input) input.focus();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative hidden md:flex items-center w-64 lg:w-80">
      <Search 
        size={16} 
        className="absolute left-3.5 pointer-events-none" 
        style={{ color: COLORS.textMuted }}
      />
      
      <input
        id="saas-global-search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search console..."
        className="w-full text-xs font-semibold py-2.5 pl-10 pr-16 outline-none transition-all duration-200 rounded-xl border border-white/5"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          color: COLORS.textMain
        }}
        onFocus={(e) => {
          e.target.style.borderColor = COLORS.primaryLight;
          e.target.style.background = "#1E293B";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(255,255,255,0.05)";
          e.target.style.background = "rgba(255,255,255,0.04)";
        }}
      />
      
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
