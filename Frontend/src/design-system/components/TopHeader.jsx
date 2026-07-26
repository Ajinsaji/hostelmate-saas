import { Menu, Search, Bell } from "lucide-react";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";
import { spacing } from "../tokens/spacing";

export function TopHeader({ onMenuClick, ownerPhotoUrl, notificationCount = 0 }) {
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
          style={{ color: colors.textPrimary }}
        >
          <Menu size={24} />
        </button>
        <span 
          style={{ 
            fontFamily: typography.fontFamily, 
            fontWeight: typography.weights.bold,
            fontSize: "18px",
            color: colors.textPrimary
          }}
        >
          HostelMate
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button style={{ color: colors.textSecondary }}>
          <Search size={22} />
        </button>
        
        <button style={{ color: colors.textSecondary, position: "relative" }}>
          <Bell size={22} />
          {notificationCount > 0 && (
            <span 
              className="absolute top-0 right-0 rounded-full flex items-center justify-center text-white"
              style={{
                background: colors.danger,
                width: "14px",
                height: "14px",
                fontSize: "9px",
                fontWeight: typography.weights.bold,
                transform: "translate(2px, -2px)"
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
            borderColor: colors.border,
            background: colors.border
          }}
        >
          {ownerPhotoUrl ? (
            <img src={ownerPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
      </div>
    </header>
  );
}
