import { ArrowLeft, User, Building, Lock, LogOut, QrCode, Copy, Download, Share2, X } from "lucide-react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../services/api";
import useOwnerRealtimeSync from "../hooks/useOwnerRealtimeSync";

import buildQrUrl from "../utils/buildQrUrl";


function Profile() {
  const navigate = useNavigate();
  const [ownerData, setOwnerData] = useState({
    ownerName: "", phone: "", email: ""
  });
  const [hostelData, setHostelData] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [loadingHostel, setLoadingHostel] = useState(false);

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
      setLoadingHostel(true);
      try {
        const response = await api.get("/api/owner/dashboard");
        if (response.data?.success && response.data.hostel) {
          setHostelData(response.data.hostel);
        } else {
          toast.error(response.data?.message || "Unable to load hostel details.");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Unable to load hostel details.");
      } finally {
        setLoadingHostel(false);
      }
    };
    fetchHostelData();
  }, []);

  useOwnerRealtimeSync({
    onSnapshotChange: (snapshot) => {
      setOwnerData((prev) => ({
        ownerName: snapshot.ownerName || prev.ownerName,
        phone: snapshot.phone || prev.phone,
        email: snapshot.email || prev.email,
      }));

      if (snapshot.hostel && snapshot.hostel.hostelName) {
        setHostelData((prev) => ({
          ...prev,
          ...snapshot.hostel,
        }));
      }
    },
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDownloadQR = () => {
    if (!hostelData?.qrCodeUrl) {
      toast.error("QR code not available");
      return;
    }
    const link = document.createElement("a");
    link.href = buildQrUrl(hostelData.qrCodeUrl);
    link.download = `${hostelData.hostelName}-qr.png`;
    link.click();
    toast.success("QR code downloaded!");
  };

  const handleShareQR = () => {
    const publicUrl = hostelData?.publicUrl || `${window.location.origin}/public/hostel/${hostelData?.uniqueCode}`;
    const text = `Join ${hostelData?.hostelName}! Click here to apply: ${publicUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: hostelData?.hostelName,
        text: text,
        url: publicUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Link and text copied to clipboard!");
    }
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
            icon={<QrCode size={20} color="var(--primary)" />}
            title="View Public QR"
            subtitle="Share hostel admission link"
            onClick={() => setShowQRModal(true)}
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

        <button 
          onClick={handleLogout}
          className="btn-primary" 
          style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--status-pending)", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
        >
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* QR Modal */}
      {showQRModal && hostelData && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="card glass-card" style={{
            background: "rgba(11, 23, 57, 0.95)",
            maxWidth: "400px",
            width: "100%",
            borderRadius: "20px",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 className="text-h2">Admission Link</h2>
              <button
                className="btn-icon"
                onClick={() => setShowQRModal(false)}
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", marginBottom: "12px" }}>{hostelData.hostelName}</p>
              {hostelData.qrCodeUrl && (
                <img 
                  src={buildQrUrl(hostelData.qrCodeUrl)}
                  alt="Hostel QR Code" 
                  style={{ width: "240px", height: "240px", borderRadius: "12px", marginBottom: "16px" }}
                />
              )}
            </div>

            <div style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: "12px",
              padding: "12px",
              marginBottom: "16px",
              wordBreak: "break-all",
              fontSize: "12px",
              color: "rgba(255,255,255,0.7)"
            }}>
              {hostelData.publicUrl || `${window.location.origin}/public/hostel/${hostelData.uniqueCode}`}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => {
                  const url = hostelData.publicUrl || `${window.location.origin}/public/hostel/${hostelData.uniqueCode}`;
                  handleCopy(url);
                }}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  color: "#22c55e",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: "600"
                }}
              >
                <Copy size={16} /> Copy Link
              </button>

              <button
                onClick={handleDownloadQR}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(59, 130, 246, 0.1)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  color: "#3b82f6",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: "600"
                }}
              >
                <Download size={16} /> Download QR
              </button>

              <button
                onClick={handleShareQR}
                style={{
                  padding: "12px",
                  borderRadius: "12px",
                  background: "rgba(168, 85, 247, 0.1)",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  color: "#a855f7",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: "600"
                }}
              >
                <Share2 size={16} /> Share
              </button>
            </div>
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