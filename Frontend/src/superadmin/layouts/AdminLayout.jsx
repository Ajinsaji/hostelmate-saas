import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  Building, 
  CreditCard, 
  HelpCircle, 
  Settings,
  X,
  Menu,
  Activity,
  LogOut,
  UserCheck,
  Users,
  Wallet,
  Landmark,
  BarChart3,
  LineChart,
  MessageCircle,
  ShieldAlert,
  User
} from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminFooter from "./AdminFooter";
import SupportBanner from "./SupportBanner";
import AdminRightDrawer from "../components/AdminRightDrawer";
import CommandPalette from "../components/CommandPalette";
import { DrawerProvider } from "../contexts/DrawerContext";
import { COLORS } from "../constants/theme";

export const AdminLayout = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Command Palette global shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const mobileNavItems = [
    { label: "Admin", href: "/admin/dashboard", icon: Home },
    { label: "Hostels", href: "/admin/hostels", icon: Building },
    { label: "Plans", href: "/admin/subscriptions", icon: CreditCard },
    { label: "Support", href: "/admin/support", icon: HelpCircle },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <DrawerProvider>
      <div 
        className="min-h-screen flex flex-col font-sans"
        style={{ background: COLORS.background, color: COLORS.textMain }}
      >
        <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <AdminRightDrawer />
        
        {/* Top Banner Mode warning indicator */}
      <SupportBanner />

      <div className="flex flex-1 relative">
        {/* Permanent Sidebar for large viewports */}
        <AdminSidebar />

        {/* Core Layout Main section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header navigation bar */}
          <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />

          {/* Core Page content renderer */}
          <main className="flex-1">
            <Outlet />
          </main>

          {/* Platform branding status footer */}
          <AdminFooter />
        </div>
      </div>

      {/* Mobile Drawer (menu panel) overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[5000] lg:hidden flex">
          {/* Drawer backdrop blur */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Drawer content sheet */}
          <div 
            className="relative w-72 h-full flex flex-col p-6 animate-slide-up"
            style={{ background: COLORS.background }}
          >
            {/* Close button */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity size={18} style={{ color: COLORS.primaryLight }} />
                <span className="text-xs font-black uppercase tracking-wider">Console Menu</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-xl hover:bg-white/5"
                aria-label="Close menu drawer"
              >
                <X size={20} style={{ color: COLORS.textMuted }} />
              </button>
            </div>

            {/* Nav list - simplified representation of sidebar */}
            <nav className="flex-1 overflow-y-auto space-y-1">
              <p className="text-[9px] uppercase tracking-wider font-extrabold text-white/30 px-3 mb-2">Navigation</p>
              
              <MobileDrawerButton label="Dashboard" href="/admin/dashboard" icon={Home} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Requests" href="/admin/requests" icon={Building} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Hostels" href="/admin/hostels" icon={Building} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Owners" href="/admin/owners" icon={Building} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Residents" href="/admin/residents" icon={Building} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Subscriptions" href="/admin/subscriptions" icon={CreditCard} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Revenue" href="/admin/revenue" icon={CreditCard} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Finance" href="/admin/finance" icon={CreditCard} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="BI Analytics" href="/admin/analytics" icon={Activity} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Customer Success" href="/admin/customer-success" icon={Activity} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Support Desk" href="/admin/support" icon={HelpCircle} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Audit Trails" href="/admin/audit" icon={Settings} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Settings" href="/admin/settings" icon={Settings} activePath={location.pathname} navigate={navigate} />
              <MobileDrawerButton label="Profile" href="/admin/profile" icon={Settings} activePath={location.pathname} navigate={navigate} />
            </nav>

            <button 
              onClick={handleLogout}
              className="mt-auto w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs"
              style={{ color: COLORS.error, background: COLORS.errorBg }}
            >
              <LogOut size={16} />
              Exit Console
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (pinned) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 h-16 lg:hidden border-t flex items-center justify-around z-40 backdrop-blur-xl"
        style={{
          background: "rgba(11, 17, 32, 0.8)",
          borderColor: COLORS.border
        }}
      >
        {mobileNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="flex flex-col items-center justify-center gap-1 h-full px-4 select-none"
              style={{ color: isActive ? COLORS.primaryLight : COLORS.textMuted }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </DrawerProvider>
  );
});

function MobileDrawerButton({ label, href, icon: Icon, activePath, navigate }) {
  const isActive = activePath.startsWith(href);
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition"
      style={{
        background: isActive ? COLORS.primary : "transparent",
        color: isActive ? COLORS.textMain : COLORS.textSecondary
      }}
    >
      <Icon size={16} style={{ color: isActive ? COLORS.textMain : COLORS.textMuted }} />
      {label}
    </button>
  );
}

export default AdminLayout;
