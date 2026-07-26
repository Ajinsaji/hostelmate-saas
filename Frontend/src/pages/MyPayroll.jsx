import { useEffect, useState } from "react";
import {
  DollarSign,
  Download,
  CreditCard,
  PlusCircle,
  FileText,
  Clock,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { PageShell, GlassCard, StatusPill } from "../owner/PremiumUI";

export default function MyPayroll() {
  const [history, setHistory] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);

  // Advance modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ amount: "", reason: "" });

  useEffect(() => {
    fetchMyPayroll();
  }, []);

  const fetchMyPayroll = async () => {
    setLoading(true);
    try {
      const [payRes, advRes] = await Promise.all([
        api.get("/api/payroll/me"),
        api.get("/api/payroll/advance"),
      ]);

      if (payRes.data.success) setHistory(payRes.data.history || []);
      if (advRes.data.success) setAdvances(advRes.data.advances || []);
    } catch (error) {
      toast.error("Unable to load salary history");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceSubmit = async () => {
    if (!advanceForm.amount || !advanceForm.reason) {
      toast.error("Please enter advance amount and reason");
      return;
    }
    try {
      const response = await api.post("/api/payroll/advance", advanceForm);
      if (response.data.success) {
        toast.success("Salary advance request submitted");
        setIsAdvanceModalOpen(false);
        setAdvanceForm({ amount: "", reason: "" });
        fetchMyPayroll();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit advance request");
    }
  };

  const latestRecord = history[0];

  return (
    <PageShell
      title="My Payroll & Salary History"
      subtitle="Monthly Payslips, Salary Breakdown, Overtime Earnings & Advance Claims"
    >
      {/* Latest Salary Banner Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-slate-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 inline-block">
              Latest Processed Payroll
            </span>
            <h2 className="text-3xl font-black text-white">
              ₹{(latestRecord?.netSalary || 0).toLocaleString("en-IN")}{" "}
              <span className="text-xs text-slate-400 font-normal">/ net salary</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Status: <span className="text-emerald-400 font-bold">{latestRecord?.status || "Pending Calculation"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {latestRecord?._id && (
              <button
                onClick={() => window.open(`/api/payroll/payslip/${latestRecord._id}`, "_blank")}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
              >
                <Download size={16} /> Download Payslip PDF
              </button>
            )}
            <button
              onClick={() => setIsAdvanceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700"
            >
              <PlusCircle size={16} /> Request Advance
            </button>
          </div>
        </div>
      </div>

      {/* Salary Breakdown Summary */}
      {latestRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <GlassCard className="p-4">
            <p className="text-slate-400 text-xs font-medium">Basic + Allowances</p>
            <p className="text-lg font-bold text-white mt-1">
              ₹{((latestRecord.basicSalary || 0) + (latestRecord.allowances || 0)).toLocaleString("en-IN")}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-slate-400 text-xs font-medium">Overtime Earnings</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">
              + ₹{(latestRecord.overtimeEarnings || 0).toLocaleString("en-IN")}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-slate-400 text-xs font-medium">Leave & Deductions</p>
            <p className="text-lg font-bold text-rose-400 mt-1">
              - ₹{(latestRecord.deductions || 0).toLocaleString("en-IN")}
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-slate-400 text-xs font-medium">Advance Recovered</p>
            <p className="text-lg font-bold text-amber-400 mt-1">
              ₹{(latestRecord.advanceRecovery || 0).toLocaleString("en-IN")}
            </p>
          </GlassCard>
        </div>
      )}

      {/* Salary History Table */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3">Salary History & Payslips</h3>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No historical salary records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2 px-2">Payment Date</th>
                  <th className="pb-2 px-2">Gross Salary</th>
                  <th className="pb-2 px-2">Overtime</th>
                  <th className="pb-2 px-2">Deductions</th>
                  <th className="pb-2 px-2">Net Salary</th>
                  <th className="pb-2 px-2">Status</th>
                  <th className="pb-2 px-2 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {history.map((record) => (
                  <tr key={record._id}>
                    <td className="py-2.5 px-2 font-medium">
                      {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : "Pending"}
                    </td>
                    <td className="py-2.5 px-2">₹{(record.grossSalary || 0).toLocaleString("en-IN")}</td>
                    <td className="py-2.5 px-2 text-emerald-400">+ ₹{(record.overtimeEarnings || 0).toLocaleString("en-IN")}</td>
                    <td className="py-2.5 px-2 text-rose-400">- ₹{(record.deductions || 0).toLocaleString("en-IN")}</td>
                    <td className="py-2.5 px-2 font-bold text-emerald-400">₹{(record.netSalary || 0).toLocaleString("en-IN")}</td>
                    <td className="py-2.5 px-2">
                      <StatusPill tone={record.status === "Paid" ? "success" : "warning"}>{record.status}</StatusPill>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => window.open(`/api/payroll/payslip/${record._id}`, "_blank")}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs border border-slate-700"
                        title="Download Payslip"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Salary Advance Request Modal */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-1">Request Salary Advance</h3>
            <p className="text-xs text-slate-400 mb-4">Request an advance against next month's salary</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 mb-1 block">Requested Amount (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="5000"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Reason for Advance</label>
                <textarea
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="e.g. Medical emergency, urgent travel..."
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAdvanceModalOpen(false)} className="px-4 py-2 bg-slate-800 text-xs rounded-xl">Cancel</button>
              <button onClick={handleAdvanceSubmit} className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
