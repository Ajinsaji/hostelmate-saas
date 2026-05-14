import { ArrowLeft, User, Building, Lock, LogOut } from "lucide-react";

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

        <button 
          onClick={handleLogout}
          className="btn-primary" 
          style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--status-pending)", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
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

