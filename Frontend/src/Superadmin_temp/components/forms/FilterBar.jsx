import React from "react";
import { Filter } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const FilterBar = React.memo(({
  filters = [], // array of { key, label, options: [{ label, value }] }
  selectedValues = {},
  onFilterChange,
  className = ""
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 w-full ${className}`}>
      {/* Icon Indicator */}
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 select-none"
        style={{ background: COLORS.surfaceLight, color: COLORS.textMuted }}
      >
        <Filter size={16} />
      </div>

      {/* Dynamic Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filt) => (
          <div key={filt.key} className="flex flex-col min-w-[120px]">
            <select
              value={selectedValues[filt.key] || ""}
              onChange={(e) => onFilterChange && onFilterChange(filt.key, e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border outline-none cursor-pointer transition-all"
              style={{
                background: "#1E293B",
                borderColor: COLORS.border,
                color: COLORS.textSecondary
              }}
              onFocus={(e) => {
                e.target.style.borderColor = COLORS.primaryLight;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = COLORS.border;
              }}
            >
              <option value="" style={{ background: "#0f172a" }}>
                {filt.label}
              </option>
              {filt.options.map((opt) => (
                <option 
                  key={opt.value} 
                  value={opt.value}
                  style={{ background: "#0f172a" }}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        
        {/* Reset button if filters active */}
        {Object.values(selectedValues).some(Boolean) && (
          <button
            onClick={() => {
              if (onFilterChange) {
                filters.forEach(f => onFilterChange(f.key, ""));
              }
            }}
            className="text-[11px] font-bold px-3 py-2 hover:bg-white/5 hover:text-white rounded-xl transition"
            style={{ color: COLORS.textMuted }}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
});

export default FilterBar;
