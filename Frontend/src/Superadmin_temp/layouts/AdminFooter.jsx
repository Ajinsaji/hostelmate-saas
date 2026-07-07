import React from "react";
import { COLORS } from "../constants/theme";

export const AdminFooter = React.memo(() => {
  return (
    <footer 
      className="py-4 px-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 select-none"
      style={{
        background: "rgba(11, 17, 32, 0.2)",
        borderColor: COLORS.border
      }}
    >
      <p className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
        © 2026 HostelMate OS. All rights reserved.
      </p>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: COLORS.success }} />
          <span className="text-[10px] font-semibold" style={{ color: COLORS.textMuted }}>
            API Connected (Uptime: 100%)
          </span>
        </div>
        <span className="text-[10px] font-bold" style={{ color: COLORS.textMuted }}>
          Console Version: 3.0.0
        </span>
      </div>
    </footer>
  );
});

export default AdminFooter;
