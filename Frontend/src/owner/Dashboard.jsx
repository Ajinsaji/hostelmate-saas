import { BedDouble, Users, Wallet, FileText, Bell, ArrowRight, IndianRupee, QrCode, ShieldCheck, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import BottomNav from "../components/BottomNav";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ residents: "-", rooms: "-", occupancyRate: "-", pendingRent: "-", todayCollection: "-" });
  const [pendingCount, setPendingCount] = useState(0);
  const [hostel, setHostel] = useState(null);
  const [ownerName, setOwnerName] = useState("Hostel Owner");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.ownerName) {
      setOwnerName(user.ownerName);
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/owner/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setStats(response.data.stats);
          setHostel(response.data.hostel || null);
          if (response.data.hostel?.hostelName) {
            setHostel(response.data.hostel);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  // Fetch pending admission count with auto-refresh every 20 seconds
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/owner/pending-count`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (response.data.success) {
          setPendingCount(response.data.pendingAdmissions || 0);
        }
      } catch (error) {
        console.error("Failed to fetch pending count", error);
      }
    };

    fetchPendingCount();

    // Optimized refresh: avoid overlapping requests
    const interval = setInterval(() => {
      fetchPendingCount();
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pb-24">
      {/* HEADER */}
      <div className="gradient-header mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-small" style={{ color: "rgba(255,255,255,0.8)" }}>Welcome Back, {ownerName} 👋</p>
            <h1 className="text-h1" style={{ color: "white" }}>{hostel?.hostelName || "HostelMate Premium"}</h1>
            <p className="text-small" style={{ color: "rgba(255,255,255,0.75)", marginTop: 8 }}>
              “Small improvements every day create big success.”
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              className="btn-icon" 
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", position: "relative" }}
              onClick={() => navigate("/admissions")}
            >
              <Bell size={24} color="white" />
              {pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: "bold",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "pulse 2s infinite"
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>

            <button className="btn-icon" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }} onClick={() => navigate("/profile")}>
              <Settings size={24} color="white" />
            </button>
          </div>
        </div>

        {/* HERO CARD */}
        <div style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.18)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "24px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            width: "150px", height: "150px",
            borderRadius: "50%",
            background: "rgba(15, 93, 70, 0.14)",
            top: "-50px", right: "-30px"
          }} />
          <p style={{ color: "rgba(255,255,255,0.9)", marginBottom: "8px", fontWeight: 500 }}>Your premium SaaS dashboard</p>
          <h2 className="text-h2" style={{ color: "white", marginBottom: "12px", lineHeight: 1.3 }}>
            Manage your hostel with clarity and speed.
          </h2>
          <p className="text-small" style={{ color: "rgba(255,255,255,0.78)" }}>
            Rooms, residents, payments, and reports in one premium experience.
          </p>
        </div>
      </div>

      <div className="p-4 flex-col gap-6">
        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <StatCard title="Residents" value={stats.residents} icon={<Users size={24} color="var(--primary)" />} />
          <StatCard title="Rooms" value={stats.rooms} icon={<BedDouble size={24} color="var(--primary)" />} />
          <StatCard title="Occupancy" value={`${stats.occupancyRate}%`} icon={<Users size={24} color="var(--primary)" />} />
          <StatCard title="Today's Collection" value={`₹${stats.todayCollection}`} icon={<IndianRupee size={24} color="var(--primary)" />} />
          <StatCard title="Pending Rent" value={`₹${stats.pendingRent}`} icon={<Wallet size={24} color="var(--status-pending)" />} full />
        </div>

        {/* QUICK ACTIONS */}
        <div className="card">
          <h2 className="text-h2 mb-4" style={{ color: "var(--text-main)" }}>Quick Access</h2>
          <ActionButton
            title="Manage Rooms"
            subtitle="Beds, occupancy and room status"
            icon={<BedDouble size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/rooms")}
          />
          <ActionButton
            title="Pending Admissions"
            subtitle="Review digital admissions from QR"
            icon={<Users size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/admissions")}
          />
          <ActionButton
            title="Residents"
            subtitle="View and manage residents"
            icon={<Users size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/residents")}
          />
          <ActionButton
            title="Payments"
            subtitle="Rent collection and dues"
            icon={<Wallet size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/payments")}
          />
          <ActionButton
            title="Public QR & Link"
            subtitle="View and share admission QR"
            icon={<QrCode size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/profile")}
          />
          <ActionButton
            title="Staff Management"
            subtitle="Add wardens and cooks"
            icon={<ShieldCheck size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/staff")}
          />
          <ActionButton
            title="Reports"
            subtitle="Download reports and analytics"
            icon={<FileText size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/reports")}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function StatCard({ title, value, icon, full }) {
  return (
    <div className="card" style={{
      gridColumn: full ? "span 2" : "span 1",
      display: "flex", flexDirection: "column", gap: "8px"
    }}>
      <div style={{
        width: "40px", height: "40px", borderRadius: "12px",
        background: "rgba(37, 211, 102, 0.1)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {icon}
      </div>
      <p className="text-small">{title}</p>
      <h2 className="text-h1" style={{ fontSize: "28px", color: "var(--text-main)" }}>{value}</h2>
    </div>
  );
}

function ActionButton({ title, subtitle, icon, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      style={{
        background: "var(--bg-color)",
        borderRadius: "16px",
        padding: "16px",
        marginBottom: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        border: "1px solid transparent",
        touchAction: "manipulation",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(20, 241, 217, 0.35)";
        e.currentTarget.style.boxShadow = "0 18px 60px rgba(0,0,0,0.35)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translateY(0px) scale(0.99)";
      }}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = "translateY(0px) scale(0.99)";
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
    >
      <div className="flex items-center gap-4">
        <div style={{
          width: "48px", height: "48px", borderRadius: "14px",
          background: "var(--accent)",
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          {icon}
        </div>
        <div>
          <h3 className="text-h3" style={{ marginBottom: "4px" }}>{title}</h3>
          <p className="text-small">{subtitle}</p>
        </div>
      </div>
      <ArrowRight size={20} color="var(--text-muted)" />
    </div>
  );
}

export default Dashboard;