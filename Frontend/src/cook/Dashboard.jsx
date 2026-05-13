import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Coffee, Food, Moon } from "lucide-react";

function CookDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ breakfast: 0, lunch: 0, dinner: 0, vacationMode: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setStats(response.data.stats || {});
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="pb-24 p-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-h1">Cook Panel</h1>
          <p className="text-small" style={{ color: "rgba(255,255,255,0.75)" }}>Daily meal counts for the mess team.</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>

      {loading ? (
        <p className="text-small">Loading meal summary...</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          <StatCard title="Breakfast" value={stats.breakfast} icon={<Coffee size={22} />} />
          <StatCard title="Lunch" value={stats.lunch} icon={<Food size={22} />} />
          <StatCard title="Dinner" value={stats.dinner} icon={<Moon size={22} />} />
          <StatCard title="Vacation Mode" value={stats.vacationMode} icon={<CalendarDays size={22} />} />
        </div>
      )}
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

export default CookDashboard;
