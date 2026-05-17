import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Users, Wallet, BedDouble, Clock } from "lucide-react";

function WardenDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ residents: 0, pendingDues: 0, vacantBeds: 0, todayCollection: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get(`/api/staff/dashboard`);
        if (response.data.success) {
          setStats(response.data.stats || {});
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="pb-24 p-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-h1">Warden Panel</h1>
          <p className="text-small" style={{ color: "rgba(255,255,255,0.75)" }}>Operational view for wardens with resident, room, and dues status.</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        <StatCard title="Residents" value={stats.residents} icon={<Users size={22} />} />
        <StatCard title="Pending Dues" value={`₹${stats.pendingDues}`} icon={<Wallet size={22} />} />
        <StatCard title="Vacant Beds" value={stats.vacantBeds} icon={<BedDouble size={22} />} />
        <StatCard title="Today Collections" value={`₹${stats.todayCollection}`} icon={<Clock size={22} />} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <p className="text-small">{title}</p>
        <h2 className="text-h2" style={{ marginTop: 8 }}>{value}</h2>
      </div>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center" }}>
        {icon}
      </div>
    </div>
  );
}

export default WardenDashboard;
