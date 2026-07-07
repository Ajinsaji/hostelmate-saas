import React, { useState } from "react";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../constants/theme";

export const ProfileMenu = React.memo(() => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/5 transition duration-150"
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
          style={{ 
            borderColor: COLORS.primaryLight,
            background: COLORS.primary,
            color: COLORS.textMain
          }}
        >
          A
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[11px] font-bold leading-none" style={{ color: COLORS.textMain }}>
            Super Admin
          </p>
          <p className="text-[9px] mt-0.5 font-semibold" style={{ color: COLORS.textMuted }}>
            System Controller
          </p>
        </div>
      </button>

      {dropdownOpen && (
        <>
          <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-40" />
          <div 
            className="absolute right-0 mt-2 w-48 rounded-xl border p-1 shadow-2xl z-50 animate-slide-up"
            style={{
              background: COLORS.surface,
              borderColor: COLORS.border
            }}
          >
            <button
              onClick={() => {
                navigate("/admin/profile");
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-lg text-left"
              style={{ color: COLORS.textSecondary }}
            >
              <User size={14} />
              Profile
            </button>
            <button
              onClick={() => {
                navigate("/admin/settings");
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-white/5 rounded-lg text-left"
              style={{ color: COLORS.textSecondary }}
            >
              <Settings size={14} />
              Settings
            </button>
            
            <div className="border-t border-white/5 my-1" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-red-500/10 rounded-lg text-left"
              style={{ color: COLORS.error }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default ProfileMenu;
