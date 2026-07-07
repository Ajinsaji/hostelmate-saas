import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Download, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";

import SuperadminBottomNav from "../components/SuperadminBottomNav";

function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollection: 0,
    pendingDues: 0,
    expenses: 0,
    periodLabel: "This Month",
  });

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/admin/reports/stats");

      setStats({
        totalCollection: res.data?.totalCollection ?? 0,
        pendingDues: res.data?.pendingDues ?? 0,
        expenses: res.data?.expenses ?? 0,
        periodLabel: res.data?.periodLabel ?? "This Month",
      });
    } catch (e) {
      // Fallback demo data (remove once backend is wired)
      setStats({
        totalCollection: 0,
        pendingDues: 0,
        expenses: 0,
        periodLabel: "This Month",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1 mb-2">Super Admin Reports</h1>
        <p style={{ opacity: 0.8 }}>{stats.periodLabel} overview</p>
      </div>

      <div className="p-4 flex-col gap-4">
        {/* Main Stat */}
        <div
          className="glass-card mb-4"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
            color: "white",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <p className="text-small" style={{ color: "rgba(255,255,255,0.8)" }}>
            Total Collection
          </p>
          <div className="flex justify-between items-center mt-2">
            <h2 style={{ fontSize: "36px", fontWeight: 700 }}>
              ₹{stats.totalCollection.toLocaleString()}
            </h2>
            <TrendingUp size={32} color="white" style={{ opacity: 0.8 }} />
          </div>
        </div>

        {/* Secondary Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="card text-center" style={{ opacity: loading ? 0.7 : 1 }}>
            <div className="flex justify-center mb-2">
              <IndianRupee color="var(--status-pending)" />
            </div>
            <p className="text-small">Pending Dues</p>
            <p className="text-h2" style={{ color: "var(--status-pending)" }}>
              ₹{stats.pendingDues.toLocaleString()}
            </p>
          </div>
          <div className="card text-center" style={{ opacity: loading ? 0.7 : 1 }}>
            <div className="flex justify-center mb-2">
              <TrendingDown color="var(--primary)" />
            </div>
            <p className="text-small">Expenses</p>
            <p className="text-h2" style={{ color: "var(--primary)" }}>
              ₹{stats.expenses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="card mt-4">
          <h3 className="text-h3 mb-4">Export Reports</h3>
          <button className="btn-secondary mb-3" disabled={loading}>
            <Download size={18} /> Download Monthly PDF
          </button>
          <button className="btn-secondary" disabled={loading}>
            <Download size={18} /> Export Resident Data
          </button>
        </div>
      </div>

      <SuperadminBottomNav />
    </div>
  );
}

export default Reports;

