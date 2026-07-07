import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  CheckSquare, 
  Building, 
  UserCheck, 
  Users, 
  CreditCard, 
  Wallet, 
  Landmark, 
  BarChart3, 
  LineChart,
  Link,
  Activity, 
  ShieldAlert, 
  Settings, 
  User, 
  LogOut,
  HelpCircle,
  MessageCircle
} from "lucide-react";
import { COLORS } from "../constants/theme";

export const AdminSidebar = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const platformItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: Home },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    { label: "Revenue Center", href: "/admin/revenue", icon: Wallet },
    { label: "Platform Finance", href: "/admin/finance", icon: Landmark },
    { label: "Monitoring", href: "/admin/monitoring", icon: Activity },
  ];

  const customerItems = [
    { label: "Onboarding Requests", href: "/admin/requests", icon: CheckSquare },
    { label: "Hostels Directory", href: "/admin/hostels", icon: Building },
    { label: "Owners CRM", href: "/admin/owners", icon: UserCheck },
    { label: "Residents Roll", href: "/admin/residents", icon: Users },
    { label: "Business BI", href: "/admin/analytics", icon: BarChart3 },
    { label: "Customer Success", href: "/admin/customer-success", icon: LineChart },
    { label: "Communication Desk", href: "/admin/communication", icon: MessageCircle },
    { label: "Support Desk", href: "/admin/support", icon: HelpCircle },
    { label: "Audit Trails", href: "/admin/audit", icon: ShieldAlert },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
    { label: "Admin Profile", href: "/admin/profile", icon: User },
  ];

  const renderNavGroup = (title, items) => (
    <div className="mb-6 select-none">
      <p 
        className="px-4 text-[9px] font-black uppercase tracking-[0.25em] mb-2" 
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {title}
      </p>
      
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 group border border-transparent ${
                isActive 
                  ? "shadow-sm border-white/5" 
                  : "bg-transparent hover:bg-white/[0.03] hover:text-white"
              }`}
              style={{
                background: isActive ? COLORS.primary : "transparent",
                color: isActive ? COLORS.textMain : COLORS.textSecondary
              }}
            >
              <Icon 
                size={16} 
                className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ color: isActive ? COLORS.textMain : COLORS.textMuted }} 
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside 
      className="hidden lg:flex lg:flex-col w-64 border-r shrink-0 h-screen sticky top-0"
      style={{
        background: "rgba(11, 17, 32, 0.4)",
        borderColor: COLORS.border
      }}
    >
      {/* Brand Header */}
      <div 
        className="px-6 py-5 border-b flex items-center gap-3 shrink-0"
        style={{ borderColor: COLORS.border }}
      >
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10"
          style={{ background: COLORS.surfaceLight }}
        >
          <Activity size={18} style={{ color: COLORS.primaryLight }} />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] font-black" style={{ color: COLORS.primaryLight }}>
            HostelMate
          </p>
          <p className="text-xs font-extrabold text-white">SaaS Command Center</p>
        </div>
      </div>

      {/* Main Nav Scroll area */}
      <div className="flex-1 overflow-y-auto px-3 py-6">
        {renderNavGroup("Platform Business", platformItems)}
        {renderNavGroup("Customer Business", customerItems)}
      </div>

      {/* Footer log out */}
      <div 
        className="p-3 border-t shrink-0"
        style={{ borderColor: COLORS.border }}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition hover:bg-red-500/10"
          style={{ color: COLORS.error }}
        >
          <LogOut size={16} className="shrink-0" />
          <span>Exit Console</span>
        </button>
      </div>
    </aside>
  );
});

export default AdminSidebar;
