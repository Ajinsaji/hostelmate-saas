import { useNavigate } from "react-router-dom";
import {
  Home,
  BedDouble,
  Users,
  Wallet,
  FileText,
  ShieldCheck,
  Bell,
  QrCode,
  Shield,
  Building,
  CheckCircle2,
  BadgePercent,
  UserCircle2,
  User,
  Settings,
} from "lucide-react";

function DesktopSidebar({ variant = "owner", activePath }) {
  const navigate = useNavigate();

  const ownerItems = [
    { key: "dashboard", icon: Home, label: "Dashboard", href: "/owner/dashboard" },
    { key: "rooms", icon: BedDouble, label: "Rooms", href: "/rooms" },
    { key: "residents", icon: Users, label: "Residents", href: "/residents" },
    { key: "payments", icon: Wallet, label: "Payments", href: "/payments" },
    { key: "reports", icon: FileText, label: "Reports", href: "/reports" },
  ];

  const adminItems = [
    { key: "admin", icon: Building, label: "Admin", href: "/admin" },
    { key: "pending", icon: CheckCircle2, label: "Pending", href: "/admin/pending-requests" },
    { key: "subscriptions", icon: BadgePercent, label: "Subscriptions", href: "/admin/subscriptions" },
    { key: "hostels", icon: Building, label: "Hostels", href: "/admin/hostels" },
    { key: "profile", icon: UserCircle2, label: "Profile", href: "/admin/profile" },
  ];

  const items = variant === "owner" ? ownerItems : adminItems;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0">
      <div className="h-[calc(100vh-0px)] sticky top-0 border-r border-white/10 bg-slate-950/40 backdrop-blur-xl">
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <ShieldCheck size={20} color="var(--primary)" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">HostelMate</p>
              <p className="text-sm font-semibold text-white">Navigation</p>
            </div>
          </div>
        </div>

        <nav className="px-3 pb-6">
          <div className="space-y-1">
            {items.map((it) => {
              const isActive = activePath === it.href;
              const Icon = it.icon;
              return (
                <button
                  key={it.key}
                  onClick={() => navigate(it.href)}
                  className={
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition " +
                    (isActive
                      ? "bg-white/10 border border-primary/30"
                      : "bg-transparent hover:bg-white/5 border border-transparent")
                  }
                >
                  <Icon size={18} color={isActive ? "var(--primary)" : "rgba(209,213,219,0.9)"} />
                  <span className="text-sm font-semibold text-left text-white/90">{it.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}

export default DesktopSidebar;

