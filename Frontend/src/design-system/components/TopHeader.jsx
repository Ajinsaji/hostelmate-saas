import { Menu, Search, Bell } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export function TopHeader({ onMenuClick, ownerPhotoUrl, notificationCount = 0 }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <header 
      className="flex items-center justify-between w-full"
      style={{
        padding: `${spacing.md} ${spacing.lg}`,
        background: "transparent",
      }}
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-1 rounded-md"
          style={{ color: colors.text.primary }}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <span 
          style={{ 
            fontFamily: typography.fontFamily, 
            fontWeight: typography.weights.bold,
            fontSize: "18px",
            color: colors.text.primary
          }}
        >
          HostelMate
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button style={{ color: colors.text.secondary }} aria-label="Search">
          <Search size={22} />
        </button>
        
        <button style={{ color: colors.text.secondary, position: "relative" }} aria-label="Notifications">
          <Bell size={22} />
          {notificationCount > 0 && (
            <span 
              className="absolute top-0 right-0 rounded-full flex items-center justify-center text-white"
              style={{
                background: colors.accent.danger,
                width: "14px",
                height: "14px",
                fontSize: "9px",
                fontWeight: typography.weights.bold,
                transform: "translate(2px, -2px)",
                color: colors.text.primary
              }}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <div 
          className="rounded-full overflow-hidden border"
          style={{ 
            width: "36px", 
            height: "36px", 
            borderColor: colors.border.default,
            background: colors.border.default
          }}
        >
          {ownerPhotoUrl ? (
            <img src={ownerPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div style={{ width: "100%", height: "100%", background: colors.background.elevated }} />
          )}
        </div>
      </div>
    </header>
  );
}
