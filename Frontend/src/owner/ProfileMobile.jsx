import { useState, memo } from "react";
import {
  User,
  Building,
  CreditCard,
  HardDrive,
  QrCode,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Bell,
  Laptop,
  X,
  Copy,
  Download
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const ProfileMobile = memo(function ProfileMobile({
  ownerData,
  hostelData,
  showQRModal,
  setShowQRModal,
  handleLogout,
  handleCopy,
  navigate,
  buildQrUrl,
}) {
  const { colors } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);

  const qrUrl = hostelData?.slug ? buildQrUrl(`/public/register/${hostelData.slug}`) : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* 1. Profile Banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(34, 197, 94, 0.15)",
            border: "2px solid #22C55E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#22C55E",
            fontSize: "24px",
            fontWeight: 700,
          }}
        >
          {ownerData.ownerName?.slice(0, 1).toUpperCase() || "O"}
        </div>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            {ownerData.ownerName}
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
            {ownerData.phone} • {ownerData.email}
          </p>
        </div>
      </div>

      {/* 2. Apple Settings Group 1: Account Settings */}
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingLeft: "4px" }}>
          Account Settings
        </div>
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            onClick={() => setShowQRModal(true)}
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <QrCode size={20} style={{ color: "#22C55E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Public Admission QR</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>Share QR for instant resident onboarding</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "#94A3B8" }} />
          </div>
        </div>
      </div>

      {/* 3. Apple Settings Group 2: Workspace & Hostel */}
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingLeft: "4px" }}>
          Workspace & Hostel
        </div>
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            onClick={() => navigate("/owner/hostel-settings")}
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Building size={20} style={{ color: "#22C55E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Hostel Configurations</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>{hostelData?.hostelName || "Address, phone, and rules"}</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "#94A3B8" }} />
          </div>

          <div
            onClick={() => navigate("/owner/billing")}
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <CreditCard size={20} style={{ color: "#22C55E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Billing & Subscription</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>Plan status and invoices</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "#94A3B8" }} />
          </div>

          <div
            onClick={() => navigate("/owner/storage-center")}
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <HardDrive size={20} style={{ color: "#22C55E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Storage & Drive</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>Google Drive cloud storage</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "#94A3B8" }} />
          </div>
        </div>
      </div>

      {/* 4. Apple Settings Group 3: Security & Preferences */}
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", paddingLeft: "4px" }}>
          Security & Notifications
        </div>
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Bell size={20} style={{ color: "#22C55E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Push Notifications</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>Payment alerts & complaints</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              style={{ width: "20px", height: "20px", accentColor: "#22C55E", cursor: "pointer" }}
            />
          </div>

          <div
            onClick={() => navigate("/owner/security/devices")}
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${colors.border.default || "#202B45"}`,
              cursor: "pointer",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Laptop size={20} style={{ color: "#22C55E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Your Devices</div>
                <div style={{ fontSize: "12px", color: "#94A3B8" }}>Manage active sessions & logged in devices</div>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: "#94A3B8" }} />
          </div>

          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minHeight: "48px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShieldCheck size={20} style={{ color: "#22C55E" }} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>Role Based Access (RBAC)</div>
                <div style={{ fontSize: "12px", color: "#22C55E", fontWeight: 700 }}>Owner Admin Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          background: "rgba(239, 68, 68, 0.12)",
          color: "#EF4444",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "16px",
          padding: "14px",
          fontSize: "14px",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          minHeight: "48px",
          marginTop: "12px",
        }}
      >
        <LogOut size={20} />
        <span>Log Out</span>
      </button>

      {/* PUBLIC ADMISSION QR MODAL */}
      {showQRModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              background: colors.background.primary || "#0B1220",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                Public Admission QR
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {qrUrl ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "16px" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                  alt="Public Admission QR Code"
                  style={{ width: "180px", height: "180px", borderRadius: "16px", background: "#FFFFFF", padding: "10px" }}
                />
                <div style={{ fontSize: "13px", color: "#94A3B8", wordBreak: "break-all" }}>{qrUrl}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%" }}>
                  <button
                    onClick={() => handleCopy(qrUrl)}
                    style={{
                      background: "#22C55E",
                      color: "#FFF",
                      border: "none",
                      borderRadius: "12px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      minHeight: "44px",
                    }}
                  >
                    <Copy size={16} /> Copy Link
                  </button>
                  <button
                    onClick={() => window.open(qrUrl, "_blank")}
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#FFF",
                      border: "1px solid #202B45",
                      borderRadius: "12px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      minHeight: "44px",
                    }}
                  >
                    <Download size={16} /> Open Link
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: "#94A3B8", fontSize: "14px", padding: "24px" }}>
                Public admission slug not configured yet. Set up in Hostel Settings.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfileMobile;
