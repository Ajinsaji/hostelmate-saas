import { ArrowLeft, User, Building, Lock, QrCode, LogOut, Ticket, Settings, Copy, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
          <MenuItem icon={<Building size={20} color="var(--primary)" />} title="Hostel Settings" subtitle="Update hostel details and address" />
          <div style={{ borderBottom: "1px solid var(--border-color)" }}></div>
          <MenuItem icon={<User size={20} color="var(--primary)" />} title="Owner Profile" subtitle="Manage personal information" />
          <div style={{ borderBottom: "1px solid var(--border-color)" }}></div>
          <MenuItem icon={<Lock size={20} color="var(--primary)" />} title="Update Password" subtitle="Change your login password" />
        </div>

        <div className="card p-0 overflow-hidden mb-6">
          <MenuItem icon={<Settings size={20} color="var(--status-paid)" />} title="Bank Details" subtitle="Manage account for settlements" />
          <div style={{ borderBottom: "1px solid var(--border-color)" }}></div>
          <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setShowQR(true)}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(37, 211, 102, 0.1)", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <QrCode size={20} color="var(--status-paid)" />
            </div>
            <div>
              <h3 className="text-h3" style={{ marginBottom: 2 }}>Public Admission QR</h3>
              <p className="text-small">View your hostel's public QR code</p>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden mb-6">
          <MenuItem icon={<Ticket size={20} color="var(--status-pending)" />} title="Support Ticket" subtitle="Contact HostelMate team" />
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
          background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 1000, padding: "20px"
        }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "20px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
            <h2 style={{ color: "var(--primary-dark)", marginBottom: "8px", fontSize: "20px", fontWeight: "bold" }}>Digital Admission QR</h2>
            <p className="text-small text-muted mb-4">Residents can scan this to request admission.</p>
            
            {hostelData.qrCodeUrl ? (
              <>
                <img src={`${import.meta.env.VITE_API_URL}/uploads/${hostelData.qrCodeUrl}`} alt="QR Code" style={{ width: "200px", height: "200px", margin: "0 auto", borderRadius: "10px", border: "1px solid #eee" }} />
                <div className="flex justify-center gap-2 mt-4">
                  <a href={`${import.meta.env.VITE_API_URL}/uploads/${hostelData.qrCodeUrl}`} download className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-2 rounded-lg text-gray-700 font-medium">
                    <Download size={14} /> Download QR
                  </a>
                  <button onClick={() => handleCopy(hostelData.publicUrl)} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-lg font-medium">
                    <Copy size={14} /> Copy Link
                  </button>
                </div>
              </>
            ) : (
              <p className="p-8 bg-gray-100 rounded-xl text-muted text-small">QR Code not generated yet.</p>
            )}
            
            <div style={{ marginTop: "16px", textAlign: "left", background: "#f8fafc", padding: "16px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}>
                <strong className="text-xs">Public Link:</strong>
                <p style={{ fontSize: "12px", color: "var(--primary)", margin: 0 }}>{hostelData.publicUrl}</p>
              </div>
              <button onClick={() => handleCopy(hostelData.publicUrl)} style={{ padding: "8px", background: "white", borderRadius: "8px", border: "1px solid #eee" }}>
                <Copy size={16} color="var(--text-muted)" />
              </button>
            </div>
            
            <button onClick={() => setShowQR(false)} style={{ marginTop: "20px", background: "var(--primary)", color: "white", padding: "10px 20px", borderRadius: "10px", width: "100%", border: "none" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer" onClick={() => toast("Coming soon!")}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(37, 211, 102, 0.1)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {icon}
      </div>
      <div>
        <h3 className="text-h3" style={{ marginBottom: 2 }}>{title}</h3>
        <p className="text-small">{subtitle}</p>
      </div>
    </div>
  );
}

export default Profile;
