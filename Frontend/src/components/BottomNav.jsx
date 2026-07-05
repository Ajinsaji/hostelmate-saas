import { motion } from "framer-motion";
import { Home, BedDouble, Users, Wallet, FileText, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { key: "home", label: "Home", icon: Home, paths: ["/owner/dashboard", "/owner"] },
  { key: "rooms", label: "Rooms", icon: BedDouble, paths: ["/rooms"] },
  { key: "residents", label: "Residents", icon: Users, paths: ["/residents"] },
  { key: "payments", label: "Payments", icon: Wallet, paths: ["/payments"] },
  { key: "reports", label: "Reports", icon: FileText, paths: ["/reports"] },
  { key: "profile", label: "Profile", icon: UserRound, paths: ["/owner/profile", "/profile"] },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (paths) =>
    paths.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  return (
    <div className="lg:hidden">
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 60,
          paddingLeft: "max(10px, env(safe-area-inset-left))",
          paddingRight: "max(10px, env(safe-area-inset-right))",
          paddingBottom: "max(10px, env(safe-area-inset-bottom))",
          paddingTop: 10,
          background: "rgba(8, 19, 39, 0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -16px 40px rgba(0, 0, 0, 0.22)",
        }}
      >
        <div
          aria-label="Bottom navigation"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            alignItems: "center",
            gap: 4,
            width: "100%",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          {NAV_ITEMS.map(({ key, label, icon: Icon, paths }) => {
            const active = isActive(paths);

            return (
              <NavItem
                key={key}
                icon={<Icon size={20} />}
                text={label}
                isActive={active}
                onClick={() => navigate(paths[0])}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, text, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        cursor: "pointer",
        border: "none",
        background: "transparent",
        color: isActive ? "#16C47F" : "#AEB8C6",
        fontSize: 10,
        fontWeight: isActive ? 700 : 600,
        padding: "8px 2px 6px",
        borderRadius: 16,
        minHeight: 54,
        transition: "all 0.2s ease",
      }}
    >
      <motion.div
        animate={{
          scale: isActive ? 1.04 : 1,
          boxShadow: isActive ? "0 0 0 6px rgba(22, 196, 127, 0.14)" : "0 0 0 0 rgba(22, 196, 127, 0)"
        }}
        transition={{ duration: 0.2 }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isActive ? "rgba(22, 196, 127, 0.15)" : "rgba(255,255,255,0.04)",
          color: isActive ? "#16C47F" : "#AEB8C6",
        }}
      >
        {icon}
      </motion.div>
      <span style={{ lineHeight: 1.2 }}>{text}</span>
    </button>
  );
}

export default BottomNav;
