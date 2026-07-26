import { Home, Users, Plus, BarChart2, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { colors } from "../tokens/colors";
import { typography } from "../tokens/typography";
import { shadows } from "../tokens/shadows";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Home, path: "/owner/dashboard" },
  { key: "residents", label: "Residents", icon: Users, path: "/residents" },
  { key: "add", label: "Quick Add", icon: Plus, isFab: true },
  { key: "analytics", label: "Analytics", icon: BarChart2, path: "/owner/analytics" }, // Adjust path if needed
  { key: "more", label: "More", icon: Menu, isMenu: true },
];

export function BottomNavigation({ onFabClick, onMoreClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 lg:hidden flex items-center justify-around z-50 bg-white"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        borderTop: `1px solid ${colors.border}`,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.03)",
        height: "72px"
      }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        if (item.isFab) {
          return (
            <button
              key={item.key}
              onClick={onFabClick}
              className="flex items-center justify-center rounded-full text-white transform -translate-y-4"
              style={{
                width: "56px",
                height: "56px",
                background: colors.primary,
                boxShadow: shadows.glow
              }}
            >
              <Icon size={24} />
            </button>
          );
        }

        return (
          <button
            key={item.key}
            onClick={() => {
              if (item.path) navigate(item.path);
              else if (item.isMenu && onMoreClick) onMoreClick();
            }}
            className="flex flex-col items-center justify-center gap-1 w-16 h-full"
            style={{ 
              color: active ? colors.primary : colors.textMuted,
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span 
              style={{
                fontSize: "10px",
                fontFamily: typography.fontFamily,
                fontWeight: active ? typography.weights.bold : typography.weights.medium
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
