import { Home, CheckCircle2, ShieldCheck, BadgePercent, UserCircle2, Building } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function SuperadminBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "0",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "480px",
        background: "var(--surface-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.05)",
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 10px 24px",
        zIndex: 50,
      }}
    >
      <NavItem
        icon={<Home size={24} />}
        text="Admin"
        isActive={location.pathname === "/admin"}
        onClick={() => navigate("/admin")}
      />

      <NavItem
        icon={<CheckCircle2 size={24} />}
        text="Pending"
        isActive={location.pathname === "/admin/pending-requests"}
        onClick={() => navigate("/admin/pending-requests")}
      />

      <NavItem
        icon={<ShieldCheck size={24} />}
        text="Subscriptions"
        isActive={location.pathname === "/admin/subscriptions"}
        onClick={() => navigate("/admin/subscriptions")}
      />

      <NavItem
        icon={<Building size={24} />}
        text="Hostels"
        isActive={location.pathname === "/admin/hostels"}
        onClick={() => navigate("/admin/hostels")}
      />

      <NavItem
        icon={<UserCircle2 size={24} />}
        text="Profile"
        isActive={location.pathname === "/admin/profile"}
        onClick={() => navigate("/admin/profile")}
      />
    </div>
  );
}

function NavItem({ icon, text, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
        color: isActive ? "var(--primary)" : "var(--text-muted)",
        fontSize: "12px",
        fontWeight: isActive ? "600" : "500",
        gap: "4px",
        transition: "color 0.2s",
      }}
    >
      <div
        style={{
          padding: "4px 16px",
          borderRadius: "16px",
          background: isActive ? "rgba(37, 211, 102, 0.15)" : "transparent",
          transition: "background 0.2s",
        }}
      >
        {icon}
      </div>
      {text}
    </div>
  );
}

export default SuperadminBottomNav;

