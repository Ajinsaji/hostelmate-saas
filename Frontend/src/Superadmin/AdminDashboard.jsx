import { BedDouble, Users, Wallet, FileText, Bell, ArrowRight, IndianRupee, ShieldCheck, TrendingUp, CheckCircle2, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";

import SuperadminBottomNav from "../components/SuperadminBottomNav";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pendingHostels: 0, activeHostels: 0, revenue: 0 });

  useEffect(() => {
    let mounted = true;
    let firstFetch = true;

    const fetchStats = async () => {
      try {
        const response = await api.get("/api/admin/dashboard");
        if (mounted && response.data.success) {
          setStats(response.data);
        }
      } catch (error) {
        if (firstFetch) {
          toast.error(error?.response?.data?.message || "Failed to load admin statistics.");
        } else {
          console.warn("Admin dashboard refresh failed:", error?.message || error);
        }
      } finally {
        firstFetch = false;
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 9000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      {/* HEADER (same color combos as owner Dashboard) */}
      <div className="gradient-header mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-small" style={{ color: "rgba(255,255,255,0.8)" }}>Welcome Admin</p>
            <h1 className="text-h1" style={{ color: "white" }}>HostelMate</h1>
          </div>
          <button className="btn-icon" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <Bell size={24} color="white" />
          </button>
        </div>

        {/* HERO CARD */}
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              top: "-50px",
              right: "-30px",
            }}
          />
          <div className="flex items-center gap-3 mb-2" style={{ position: "relative" }}>
            <ShieldCheck size={20} color="white" />
            <p className="text-small" style={{ color: "rgba(255,255,255,0.9)", marginBottom: 0, fontWeight: 600 }}>
              Super Admin Portal
            </p>
          </div>
          <h2 className="text-h2" style={{ color: "white", marginBottom: "12px", lineHeight: 1.3, position: "relative" }}>
            Manage Hostels & Subscriptions
          </h2>
          <p className="text-small" style={{ color: "rgba(255,255,255,0.8)", position: "relative" }}>
            Approve applications and control plans from your phone.
          </p>
        </div>
      </div>

      <div className="p-4 flex-col gap-6">
        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <StatCard title="Hostels" value={stats.activeHostels} icon={<BedDouble size={24} color="var(--primary)" />} />
          <StatCard title="Pending" value={stats.pendingHostels} icon={<Users size={24} color="var(--primary)" />} />
        </div>

        <div className="glass-card" style={{ background: "rgba(37, 211, 102, 0.18)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="flex items-center gap-4 mb-2">
            <TrendingUp size={28} color="var(--primary-light)" />
            <h3 className="text-h3" style={{ color: "var(--text-main)" }}>Total Revenue</h3>
          </div>
          <p style={{ fontSize: "36px", fontWeight: 700, color: "var(--text-main)" }}>₹{stats.revenue}</p>
          <p style={{ color: "rgba(0,0,0,0.5)", fontSize: "14px" }}>This Month</p>
        </div>

        {/* QUICK ACTIONS */}
        <div className="card">
          <h2 className="text-h2 mb-4" style={{ color: "var(--text-main)" }}>Quick Access</h2>
          <ActionButton
            title="Pending Requests"
            subtitle="Approve or reject applications"
            icon={<CheckCircle2 size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/admin/pending-requests")}
          />
          <ActionButton
            title="Hostel Management"
            subtitle="View credentials & manage hostels"
            icon={<Building size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/admin/hostels")}
          />
          <ActionButton
            title="Subscriptions"
            subtitle="Control plans and limits"
            icon={<Wallet size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/admin/subscriptions")}
          />
          <ActionButton
            title="Add Hostel"
            subtitle="Create hostel + subscription"
            icon={<BedDouble size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/admin/add-hostel")}
          />
          <ActionButton
            title="Admin Home"
            subtitle="Overview and stats"
            icon={<FileText size={22} color="var(--primary-dark)" />}
            onClick={() => navigate("/admin")}
          />
        </div>
      </div>

      <SuperadminBottomNav />
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "12px",
          background: "rgba(37, 211, 102, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "var(--accent)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
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

export default AdminDashboard;

