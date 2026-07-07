import React from "react";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../constants/theme";

export const SupportBanner = React.memo(() => {
  const navigate = useNavigate();

  return (
    <div 
      className="px-6 py-3 border-b flex items-center justify-between gap-4 select-none"
      style={{
        background: `linear-gradient(90deg, ${COLORS.primaryDark} 0%, rgba(15, 93, 70, 0.4) 100%)`,
        borderColor: COLORS.border
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ShieldAlert size={16} className="shrink-0 animate-pulse" style={{ color: COLORS.accentGold }} />
        <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.textMain }}>
          Platform Impersonation Mode is available for active support debugging. Every action is audited.
        </p>
      </div>

      <button
        onClick={() => navigate("/admin/support")}
        className="text-[10px] font-black uppercase tracking-wider shrink-0 underline hover:text-white"
        style={{ color: COLORS.accentGold }}
      >
        View Support Dashboard
      </button>
    </div>
  );
});

export default SupportBanner;
