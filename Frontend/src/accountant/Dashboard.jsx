import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  CreditCard,
  Building2,
  PieChart,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import StaffAttendanceWidget from "../components/StaffAttendanceWidget";

export default function AccountantDashboard() {
  const [stats, setStats] = useState({
    todayCollection: 0,
    outstandingRent: 0,
    todayExpenses: 0,
    bankBalance: 0,
    vendorBillsPending: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/staff/dashboard");
      if (response.data.success && response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      toast.error("Unable to load accountant dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Accountant Portal"
      subtitle="Financial Control, Accounts Payable, Expenses & Treasury Management"
    >
      {/* Self Service Attendance & Shift Widget */}
      <div className="mb-6">
        <StaffAttendanceWidget />
      </div>
      {/* Finance Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Collection</span>
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-emerald-400">
            ₹{(stats.todayCollection || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Outstanding Rent</span>
            <TrendingUp size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-amber-400">
            ₹{(stats.outstandingRent || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Expenses</span>
            <Receipt size={18} className="text-rose-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-rose-400">
            ₹{(stats.todayExpenses || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Treasury Bank Balance</span>
            <Landmark size={18} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-blue-400">
            ₹{(stats.bankBalance || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Vendor Bills</span>
            <Building2 size={18} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-400">
            {stats.vendorBillsPending || 0} Bills
          </p>
        </GlassCard>
      </div>

      {/* Module Navigation Grid */}
      <h2 className="text-lg font-bold text-slate-200 mb-4">Financial Modules & Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard hover className="p-5 cursor-pointer" onClick={() => window.location.href = "/rent-dashboard"}>
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <DollarSign size={22} />
            </div>
            <ArrowUpRight size={18} className="text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white mt-4">Rent Collection</h3>
          <p className="text-xs text-slate-400 mt-1">Record payments, view dues & generate invoices</p>
        </GlassCard>

        <GlassCard hover className="p-5 cursor-pointer" onClick={() => window.location.href = "/expense-dashboard"}>
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
              <Receipt size={22} />
            </div>
            <ArrowUpRight size={18} className="text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white mt-4">Expense Management</h3>
          <p className="text-xs text-slate-400 mt-1">Track operational expenses & category budgets</p>
        </GlassCard>

        <GlassCard hover className="p-5 cursor-pointer" onClick={() => toast.info("Opening Vendor Payments Module")}>
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
              <CreditCard size={22} />
            </div>
            <ArrowUpRight size={18} className="text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white mt-4">Accounts Payable</h3>
          <p className="text-xs text-slate-400 mt-1">Vendor invoices, vouchers & pending bills</p>
        </GlassCard>

        <GlassCard hover className="p-5 cursor-pointer" onClick={() => toast.info("Opening Treasury Module")}>
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <Landmark size={22} />
            </div>
            <ArrowUpRight size={18} className="text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white mt-4">Treasury & Bank Rec</h3>
          <p className="text-xs text-slate-400 mt-1">Bank balances, cashbook & reconciliation</p>
        </GlassCard>
      </div>

      {/* Reports & Financial Analytics */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <PieChart size={20} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">Financial Audit & Reports</h3>
              <p className="text-xs text-slate-400">Generates profit-loss, cash flow, and tax reporting summaries</p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = "/reports"}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition"
          >
            Open Financial Reports
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          <ShieldAlert size={18} className="shrink-0" />
          <span>Notice: Accountant role cannot perform resident admissions, meal planning, or room allocations.</span>
        </div>
      </GlassCard>
    </PageShell>
  );
}
