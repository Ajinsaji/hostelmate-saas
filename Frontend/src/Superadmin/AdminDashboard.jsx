import { BedDouble, Users, Wallet, FileText, Bell, ArrowRight, IndianRupee, ShieldCheck, TrendingUp, CheckCircle2, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import useGlobalPolling from "../hooks/useGlobalPolling";

import SuperadminBottomNav from "../components/SuperadminBottomNav";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pendingHostels: 0, activeHostels: 0, revenue: 0 });

  const [systemHealth, setSystemHealth] = useState({
    dataSizeMB: "0.00",
    storageSizeMB: "0.00",
    collections: 0,
    objects: 0,
    totalHostels: 0,
    totalOwners: 0,
    totalResidents: 0,
    totalRooms: 0,
    totalPayments: 0,
  });
  const [systemHealthLoading, setSystemHealthLoading] = useState(false);
  const [systemHealthError, setSystemHealthError] = useState(null);


  const fetchStats = async () => {
    try {
      const response = await api.get("/api/admin/dashboard");
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load admin statistics.");
    }
  };

  useGlobalPolling(fetchStats, { interval: 8000 });

  const fetchSystemHealth = async () => {
    setSystemHealthLoading(true);
    setSystemHealthError(null);
    try {
      const response = await api.get("/api/admin/system-health");
      if (response.data) {
        setSystemHealth(response.data);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to load system health.";
      setSystemHealthError(message);
      toast.error(message);
    } finally {
      setSystemHealthLoading(false);
    }
  };

  // Fetch once on mount; stats already poll.
  useGlobalPolling(fetchSystemHealth, { interval: 60000, immediate: true });


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

      <div className="w-full px-4 sm:px-6 lg:px-8 pb-24">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <StatCard
            title="Hostels"
            value={stats.activeHostels}
            icon={<BedDouble size={24} color="var(--primary)" />}
            onClick={() => navigate("/admin/hostels")}
          />
          <StatCard
            title="Pending"
            value={stats.pendingHostels}
            icon={<Users size={24} color="var(--primary)" />}
            onClick={() => navigate("/admin/pending-requests")}
          />
        </div>


        <div className="glass-card" style={{ background: "rgba(37, 211, 102, 0.18)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="flex items-center gap-4 mb-2">
            <TrendingUp size={28} color="var(--primary-light)" />
            <h3 className="text-h3" style={{ color: "var(--text-main)" }}>Total Revenue</h3>
          </div>
          <p style={{ fontSize: "36px", fontWeight: 700, color: "var(--text-main)" }}>₹{stats.revenue}</p>
          <p style={{ color: "rgba(0,0,0,0.5)", fontSize: "14px" }}>This Month</p>
        </div>

        {/* SYSTEM HEALTH */}
        <div className="card" style={{ padding: "18px 16px", marginBottom: "16px" }}>
          <h2 className="text-h2" style={{ color: "var(--text-main)", marginBottom: "12px" }}>
            System Health
          </h2>

          {systemHealthLoading ? (
            <div style={{ color: "rgba(255,255,255,0.7)" }}>Loading system health...</div>
          ) : systemHealthError ? (
            <div style={{ color: "#ff6b6b" }}>{systemHealthError}</div>
          ) : (
            <>
              {/* Desktop: 3 cols, Mobile: 1 col */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="glass-card" style={{ padding: "14px" }}>
                  <div className="mb-3">
                    <p className="text-small" style={{ marginBottom: 0, opacity: 0.9 }}>
                      Database Size
                    </p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
                      {Number(systemHealth.dataSizeMB).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-small" style={{ marginBottom: 0, opacity: 0.9 }}>
                      Storage Used
                    </p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)" }}>
                      {Number(systemHealth.storageSizeMB).toFixed(2)} MB
                    </p>
                  </div>

                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-small" style={{ marginBottom: 0, opacity: 0.9 }}>
                        Collections
                      </p>
                      <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
                        {systemHealth.collections ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-small" style={{ marginBottom: 0, opacity: 0.9 }}>
                        Documents
                      </p>
                      <p style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
                        {systemHealth.objects ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: "14px" }}>
                  <h3 className="text-h3" style={{ color: "var(--text-main)", marginBottom: "10px" }}>
                    Business Stats
                  </h3>
                  <MetricLine label="Total Hostels" value={systemHealth.totalHostels ?? 0} />
                  <MetricLine label="Total Owners" value={systemHealth.totalOwners ?? 0} />
                  <MetricLine label="Total Residents" value={systemHealth.totalResidents ?? 0} />
                  <MetricLine label="Total Rooms" value={systemHealth.totalRooms ?? 0} />
                  <MetricLine label="Total Payments" value={systemHealth.totalPayments ?? 0} />
                </div>

                <div className="glass-card" style={{ padding: "14px" }}>
                  {(() => {
                    const limitMB = 512;
                    const storageMB = Number(systemHealth.storageSizeMB ?? 0);
                    const usagePercent = limitMB > 0 ? (storageMB / limitMB) * 100 : 0;
                    const pct = Math.max(0, usagePercent);

                    const color = pct < 70 ? "#22c55e" : pct <= 90 ? "#f59e0b" : "#ef4444";
                    const barBg = "rgba(255,255,255,0.15)";

                    return (
                      <>
                        <h3 className="text-h3" style={{ color: "var(--text-main)", marginBottom: "10px" }}>
                          Storage Usage
                        </h3>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <p className="text-small" style={{ margin: 0, opacity: 0.9 }}>
                            {storageMB.toFixed(0)} MB / {limitMB} MB
                          </p>
                          <p className="text-small" style={{ margin: 0, color }}>
                            {pct.toFixed(0)}%
                          </p>
                        </div>

                        <div style={{ height: "10px", background: barBg, borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
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

function MetricLine({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
      <p className="text-small" style={{ margin: 0, opacity: 0.9 }}>
        {label}
      </p>
      <p style={{ margin: 0, fontWeight: 800, color: "var(--text-main)" }}>{value}</p>
    </div>
  );
}

function StatCard({ title, value, icon, onClick }) {

  return (
    <div
      className="card cursor-pointer hover:scale-[1.02] transition-all"
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      onClick={onClick}
    >

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

