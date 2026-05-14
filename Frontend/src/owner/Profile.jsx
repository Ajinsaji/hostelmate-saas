import { ArrowLeft, User, Building, Lock, QrCode, LogOut, Ticket, Settings, Copy, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import buildQrUrl from "../utils/buildQrUrl";


function Profile() {
  const navigate = useNavigate();
  const [ownerData, setOwnerData] = useState({
    ownerName: "", phone: "", email: ""
  });
  const [hostelData, setHostelData] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user) {
      setOwnerData({
        ownerName: user.ownerName || "Hostel Owner",
        phone: user.phone || "N/A",
        email: user.email || ""
      });
    }

    const fetchHostelData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/owner/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success && response.data.hostel) {
          setHostelData(response.data.hostel);
        }
      } catch (error) {
        console.error("Error fetching hostel data", error);
      }
    };
    fetchHostelData();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6 flex items-center gap-4">
        <button className="btn-icon" style={{ background: "transparent", color: "white" }} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-h1" style={{ color: "white" }}>Settings</h1>
          <p className="text-small" style={{ color: "rgba(255,255,255,0.8)" }}>Profile & Preferences</p>
        </div>
      </div>

      <div className="p-4 flex-col gap-4">
        {/* User Info Card */}
        <div className="card flex items-center gap-4 mb-4">
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--primary-light)", display: "flex", justifyContent: "center", alignItems: "center", color: "white" }}>
            <User size={32} />
          </div>
          <div>
            <h2 className="text-h2">{ownerData.ownerName}</h2>
            <p className="text-small">{ownerData.phone}</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="card p-0 overflow-hidden mb-4">
          <MenuItem
            icon={<Building size={20} color="var(--primary)" />}
            title="Hostel Settings"
            subtitle="Update hostel details and address"
            onClick={() => navigate("/owner/settings")}
          />
          <div style={{ borderBottom: "1px solid var(--border-color)" }}></div>

          <MenuItem
            icon={<User size={20} color="var(--primary)" />}
            title="Owner Profile"
            subtitle="Manage personal information"
            onClick={() => navigate("/owner/profile")}
          />
          <div style={{ borderBottom: "1px solid var(--border-color)" }}></div>

          <MenuItem
            icon={<Lock size={20} color="var(--primary)" />}
            title="Update Password"
            subtitle="Change your login password"
            onClick={() => navigate("/owner/update-password")}
          />
        </div>

        <div className="card p-0 overflow-hidden mb-6">
          <MenuItem
            icon={<Settings size={20} color="var(--status-paid)" />}
            title="Bank Details"
            subtitle="Manage account for settlements"
            onClick={() => navigate("/owner/bank-details")}
          />
          <div style={{ borderBottom: "1px solid var(--border-color)" }}></div>

          <div
            className="flex items-center gap-4 p-4 cursor-pointer"
            style={{ 
              transition: "all 0.2s ease-in-out",
              borderRadius: "12px"
            }}
            onClick={() => setShowQR(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.12)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(37, 211, 102, 0.1)", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <QrCode size={20} color="var(--status-paid)" />
            </div>
            <div>
              <h3 className="text-h3" style={{ marginBottom: 2, color: "#ffffff" }}>Public Admission QR</h3>
              <p className="text-small" style={{ color: "#ffffff" }}>View your hostel's public QR code</p>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden mb-6">
          <MenuItem
            icon={<Ticket size={20} color="var(--status-pending)" />}
            title="Support Ticket"
            subtitle="Contact HostelMate team"
            onClick={() => navigate("/owner/support")}
          />
        </div>

        <button 
          onClick={handleLogout}
          className="btn-primary" 
          style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--status-pending)", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
        >
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* QR Code Modal */}
      {showQR && hostelData && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000, padding: "20px"
        }}>
          <div style={{ background: "#172033", padding: "24px", borderRadius: "24px", maxWidth: "420px", width: "100%", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ color: "var(--text-main)", marginBottom: "8px", fontSize: "20px", fontWeight: "bold" }}>Digital Admission QR</h2>
            <p className="text-small text-muted mb-4" style={{ color: "var(--text-muted)" }}>Residents can scan this to request admission.</p>

            {hostelData.qrCodeUrl ? (
              <>
                <img
                  src={buildQrUrl(hostelData.qrCodeUrl)}
                  alt="QR Code"
                  style={{ width: "200px", height: "200px", margin: "0 auto", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}
                />

                <div className="flex justify-center gap-2 mt-4">
                  <a
                    href={buildQrUrl(hostelData.qrCodeUrl)}
download
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-main)", borderColor: "rgba(255,255,255,0.12)" }}
                  >
                    <Download size={14} /> Download QR
                  </a>

                  <button
                    onClick={() => handleCopy(hostelData.publicUrl)}
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg font-medium"
                    style={{ background: "rgba(15,93,70,0.12)", color: "var(--primary)", border: "1px solid rgba(15,93,70,0.18)" }}
                  >
                    <Copy size={14} /> Copy Link
                  </button>
                </div>
              </>
            ) : (
              <p className="p-8 rounded-xl text-small" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}>QR Code not generated yet.</p>
            )}

            <div style={{ marginTop: "16px", textAlign: "left", background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>
                <strong className="text-xs" style={{ color: "var(--text-secondary)" }}>Public Link:</strong>
                <p style={{ fontSize: "12px", color: "var(--primary)", margin: 0, wordBreak: "break-all" }}>{hostelData.publicUrl}</p>
              </div>
              <button onClick={() => handleCopy(hostelData.publicUrl)} style={{ padding: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.10)" }}>
                <Copy size={16} color="var(--text-muted)" />
              </button>
            </div>

            <button onClick={() => setShowQR(false)} style={{ marginTop: "20px", background: "var(--primary)", color: "white", padding: "12px 20px", borderRadius: "14px", width: "100%", border: "none" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, title, subtitle, onClick }) {
  return (
    <div
      className="flex items-center gap-4 p-4 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ 
        transition: "all 0.2s ease-in-out",
        borderRadius: "12px"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(16, 185, 129, 0.12)";
        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.35)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(37, 211, 102, 0.1)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {icon}
      </div>
      <div>
        <h3 className="text-h3" style={{ marginBottom: 2, color: "#ffffff" }}>{title}</h3>
        <p className="text-small" style={{ color: "#ffffff" }}>{subtitle}</p>
      </div>
    </div>
  );
}

export default Profile;

