import { Download, TrendingUp, TrendingDown, IndianRupee, BarChart3, Users, BedDouble } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import axios from "axios";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function Reports() {
  const [payments, setPayments] = useState([]);
  const [stats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [paymentRes, statsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/payments/hostel`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/owner/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setPayments(paymentRes.data?.payments || []);
        setDashboardStats(statsRes.data?.stats || {});
      } catch (e) {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const reportData = useMemo(() => {
    let filteredPayments = payments;
    
    // Simple date filtering based on payment creation
    if (dateFilter !== "all") {
      const now = new Date();
      filteredPayments = payments.filter(p => {
        if (!p.entries || p.entries.length === 0) return true;
        const lastPaymentDate = new Date(p.entries[p.entries.length-1].createdAt);
        if (dateFilter === "month") {
          return lastPaymentDate.getMonth() === now.getMonth() && lastPaymentDate.getFullYear() === now.getFullYear();
        }
        if (dateFilter === "year") {
          return lastPaymentDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    const totalRent = filteredPayments.reduce((sum, p) => sum + Number(p.totalRent || 0), 0);
    const totalPaid = filteredPayments.reduce((sum, p) => {
      const entries = Array.isArray(p.entries) ? p.entries : [];
      return sum + entries.reduce((s, e) => s + Number(e.amount || 0), 0);
    }, 0);

    const pending = Math.max(0, totalRent - totalPaid);

    // Chart Data
    const chartData = [
      { name: 'Rent Due', amount: totalRent },
      { name: 'Collected', amount: totalPaid },
      { name: 'Pending', amount: pending }
    ];

    return { totalRent, totalPaid, pending, chartData };
  }, [payments, dateFilter]);

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Resident,Month,Total Rent,Paid,Balance,Status\n";
    
    payments.forEach(p => {
      const name = p.residentId?.name || "Unknown";
      const paid = p.entries?.reduce((s,e)=>s+e.amount, 0) || 0;
      const balance = p.totalRent - paid;
      csvContent += `${name},${p.month},${p.totalRent},${paid},${balance},${p.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hostelmate_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1 mb-2">Reports & Analytics</h1>
        <p style={{ opacity: 0.8 }}>Financial overview of your hostel</p>
      </div>

      <div className="p-4 flex-col gap-4">
        {/* Filters */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-h3">Dashboard</h3>
          <select className="input-field" style={{ width: "auto", padding: "8px 12px", background: "var(--surface)" }} value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {loading && <p className="text-body text-center">Loading reports...</p>}

        {!loading && (
          <>
            <div className="glass-card mb-4" style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", color: "white" }}>
              <p className="text-small" style={{ color: "rgba(255,255,255,0.8)" }}>Total Collection</p>
              <div className="flex justify-between items-center mt-2">
                <h2 style={{ fontSize: "36px", fontWeight: 700 }}>₹{reportData.totalPaid}</h2>
                <TrendingUp size={32} color="white" style={{ opacity: 0.8 }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="card text-center">
                <div className="flex justify-center mb-2"><IndianRupee color="var(--status-pending)" /></div>
                <p className="text-small">Pending Dues</p>
                <p className="text-h2" style={{ color: "var(--status-pending)" }}>₹{reportData.pending}</p>
              </div>

              <div className="card text-center">
                <div className="flex justify-center mb-2"><Users color="var(--primary)" /></div>
                <p className="text-small">Occupancy Rate</p>
                <p className="text-h2" style={{ color: "var(--primary)" }}>{stats.occupancyRate || 0}%</p>
              </div>
            </div>

            <div className="card mb-4">
              <h3 className="text-h3 mb-4 flex items-center gap-2"><BarChart3 size={20}/> Revenue Chart</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card mt-4">
              <h3 className="text-h3 mb-4 flex items-center gap-2"><Download size={20}/> Export Reports</h3>
              <button className="btn-secondary mb-3" onClick={exportToPDF}>
                Export PDF Report
              </button>
              <button className="btn-secondary" onClick={exportToCSV}>
                Export Excel (CSV)
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Reports;
