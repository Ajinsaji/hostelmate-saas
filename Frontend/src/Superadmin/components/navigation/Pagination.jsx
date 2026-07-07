import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const Pagination = React.memo(({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ""
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-6 py-4 border-t border-white/5 ${className}`}>
      <span className="text-[11px]" style={{ color: COLORS.textMuted }}>
        Page {currentPage} of {totalPages}
      </span>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`p-2 rounded-xl border border-white/5 transition flex items-center justify-center ${
            currentPage <= 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"
          }`}
          style={{ background: COLORS.surfaceLight, color: COLORS.textSecondary }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`p-2 rounded-xl border border-white/5 transition flex items-center justify-center ${
            currentPage >= totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"
          }`}
          style={{ background: COLORS.surfaceLight, color: COLORS.textSecondary }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
});

export default Pagination;
