import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { COLORS } from "../constants/theme";

export const Breadcrumbs = React.memo(() => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="flex items-center gap-2 py-2 select-none" aria-label="Breadcrumb">
      <Link 
        to="/admin/dashboard" 
        className="flex items-center hover:text-white transition-colors"
        style={{ color: COLORS.textMuted }}
      >
        <Home size={14} className="shrink-0" />
      </Link>
      
      {pathnames.map((value, index) => {
        // Skip 'admin' since it's the root prefix
        if (value === "admin") return null;

        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        
        // Format path strings (e.g. 'customer-success' -> 'Customer Success')
        const formattedName = value
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return (
          <React.Fragment key={to}>
            <ChevronRight size={12} style={{ color: COLORS.textMuted }} className="shrink-0" />
            {last ? (
              <span 
                className="text-[11px] font-bold truncate max-w-[120px] sm:max-w-[200px]" 
                style={{ color: COLORS.textMain }}
                aria-current="page"
              >
                {formattedName}
              </span>
            ) : (
              <Link 
                to={to} 
                className="text-[11px] font-semibold hover:text-white transition-colors truncate max-w-[120px]"
                style={{ color: COLORS.textMuted }}
              >
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
});

export default Breadcrumbs;
