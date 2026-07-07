import React from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../constants/theme";

export const NotificationBell = React.memo(({
  hasNotifications = true,
  count = 3
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/admin/notifications")}
      className="relative p-2.5 rounded-xl border border-white/10 hover:scale-[1.05] active:scale-[0.95] transition-all"
      style={{ background: "rgba(255,255,255,0.04)" }}
      aria-label="View notifications"
    >
      <Bell size={20} style={{ color: COLORS.textMain }} />
      
      {hasNotifications && (
        <span 
          className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full px-1 flex items-center justify-center text-[9px] font-black border border-slate-900 select-none animate-bounce"
          style={{ 
            background: COLORS.error, 
            color: COLORS.textMain
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
});

export default NotificationBell;
