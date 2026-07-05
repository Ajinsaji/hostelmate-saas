import { Download, TrendingUp, IndianRupee, BarChart3, Users, BedDouble } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/BottomNav";
import api from "../utils/apiClient";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageShell, GlassCard, StatCard, PREMIUM_THEME } from "./PremiumUI";

function Reports() {
  const [payments, setPayments] = useState([]);
  const [stats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [paymentRes, statsRes] = await Promise.all([
          api.get("/api/payments/hostel"),
          api.get("/api/owner/dashboard")
        ]);
        setPayments(paymentRes.data?.payments || []);
        setDashboardStats(statsRes.data?.stats || {});
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load reports");
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
    csvContent += "Resident,Room,Bed,Month,Total Rent,Paid,Balance,Method,Status\n";
    
    payments.forEach((p) => {
      const name = p.residentId?.name || "Unknown";
      const room = p.residentId?.roomId?.roomNumber || p.room || "N/A";
      const bed = p.residentId?.bedId?.bedNumber || p.bed || "N/A";
      const paid = Array.isArray(p.entries) ? p.entries.reduce((s, e) => s + Number(e.amount || 0), 0) : 0;
      const balance = Number(p.totalRent || 0) - paid;
      const method = p.paymentMethod || p.method || "N/A";
      const status = p.status || (balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending");
      csvContent += `${name},${room},${bed},${p.month || "N/A"},${p.totalRent || 0},${paid},${balance},${method},${status}\n`;
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
    <PageShell
      title="Reports & analytics"
      subtitle="Financial overview and occupancy signals"
      action={
        <button onClick={exportToCSV} className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018" }}>
          Export CSV
        </button>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Dashboard</p>
          <p className="text-lg font-semibold">Revenue & occupancy snapshot</p>
        </div>
        <select className="rounded-full border px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.05)", borderColor: PREMIUM_THEME.border, color: PREMIUM_THEME.text }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="all">All time</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </select>
      </div>

      {loading ? <GlassCard className="text-center">Loading reports...</GlassCard> : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total collection" value={`₹${reportData.totalPaid.toLocaleString("en-IN")}`} caption="Payments received" icon={<TrendingUp size={18} />} />
            <StatCard label="Pending dues" value={`₹${reportData.pending.toLocaleString("en-IN")}`} caption="Outstanding balance" icon={<IndianRupee size={18} />} tone="blue" />
            <StatCard label="Occupancy" value={`${stats.occupancyRate || 0}%`} caption="Current occupancy rate" icon={<Users size={18} />} />
            <StatCard label="Rooms" value={`${stats.totalRooms || 0}`} caption="Managed rooms" icon={<BedDouble size={18} />} tone="blue" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
            <GlassCard>
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={18} style={{ color: PREMIUM_THEME.primary }} />
                <h3 className="text-lg font-semibold">Revenue trend</h3>
              </div>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: PREMIUM_THEME.muted, fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: PREMIUM_THEME.muted, fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="amount" fill={PREMIUM_THEME.primary} radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <div className="space-y-4">
              <GlassCard>
                <div className="mb-3 flex items-center gap-2">
                  <Download size={18} style={{ color: PREMIUM_THEME.primary }} />
                  <h3 className="text-lg font-semibold">Export reports</h3>
                </div>
                <div className="space-y-2">
                  <button className="w-full rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)" }} onClick={exportToPDF}>Export PDF report</button>
                  <button className="w-full rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018" }} onClick={exportToCSV}>Export Excel (CSV)</button>
                </div>
              </GlassCard>
              <GlassCard>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Finance pulse</p>
                <p className="mt-2 text-sm" style={{ color: PREMIUM_THEME.muted }}>Track due amounts, revenue recovery, and growth patterns from one place.</p>
              </GlassCard>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </PageShell>
  );
}

export default Reports;
