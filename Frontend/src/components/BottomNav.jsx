import { Home, BedDouble, Users, Wallet, FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

function BottomNav() {
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
        padding: "12px 10px 24px", /* Extra padding at bottom for modern phones */
        zIndex: 50,
      }}
    >
      <NavItem
        icon={<Home size={24} />}
        text="Home"
        isActive={location.pathname === "/owner/dashboard"}
        onClick={() => navigate("/owner/dashboard")}
      />
      <NavItem
        icon={<BedDouble size={24} />}
        text="Rooms"
        isActive={location.pathname === "/rooms"}
        onClick={() => navigate("/rooms")}
      />
      <NavItem
        icon={<Users size={24} />}
        text="Residents"
        isActive={location.pathname === "/residents"}
        onClick={() => navigate("/residents")}
      />
      <NavItem
        icon={<Wallet size={24} />}
        text="Payments"
        isActive={location.pathname === "/payments"}
        onClick={() => navigate("/payments")}
      />
      <NavItem
        icon={<FileText size={24} />}
        text="Reports"
        isActive={location.pathname === "/reports"}
        onClick={() => navigate("/reports")}
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
      <div style={{
        padding: "4px 16px",
        borderRadius: "16px",
        background: isActive ? "rgba(37, 211, 102, 0.15)" : "transparent",
        transition: "background 0.2s"
      }}>
        {icon}
      </div>
      {text}
    </div>
  );
}

export default BottomNav;
