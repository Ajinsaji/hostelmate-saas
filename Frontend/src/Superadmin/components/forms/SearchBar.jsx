import React from "react";
import { Search, X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const SearchBar = React.memo(({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}) => {
  return (
    <div className={`relative flex items-center w-full min-w-[200px] sm:min-w-[300px] ${className}`}>
      <Search 
        size={18} 
        className="absolute left-4 pointer-events-none" 
        style={{ color: COLORS.textMuted }}
      />
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs font-semibold py-3.5 pl-11 pr-11 transition-all duration-200 outline-none rounded-xl border"
        style={{
          background: "#1E293B",
          borderColor: COLORS.border,
          color: COLORS.textMain
        }}
        onFocus={(e) => {
          e.target.style.borderColor = COLORS.primaryLight;
          e.target.style.boxShadow = `0 0 0 3px rgba(15, 122, 94, 0.15)`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = COLORS.border;
          e.target.style.boxShadow = "none";
        }}
      />

      {value && (
        <button
          onClick={() => onChange && onChange("")}
          className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          style={{ color: COLORS.textMuted }}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});

export default SearchBar;
