import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  Download,
  Plus,
  Filter,
  ShieldAlert,
  Calendar,
  Clock,
  PieChart,
  Sliders,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { PageShell, GlassCard, StatusPill, PREMIUM_THEME } from "./PremiumUI";

export default function PayrollManagement() {
  const [activeTab, setActiveTab] = useState("processing"); // processing, structures, policy, adjustments, exceptions, reports
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Form states
  const [structureForm, setStructureForm] = useState({
    staffId: "",
    basicSalary: "",
    houseRentAllowance: "",
    foodAllowance: "",
    travelAllowance: "",
    providentFund: "",
    paymentMode: "Bank Transfer",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    staffId: "",
    type: "Addition",
    title: "",
    amount: "",
    reason: "",
  });

  useEffect(() => {
    fetchPayrollData();
  }, [month, year]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const [payRes, polRes, staffRes, advRes] = await Promise.all([
        api.get(`/api/payroll?month=${month}&year=${year}`),
        api.get("/api/payroll/policy"),
        api.get("/api/staff"),
        api.get("/api/payroll/advance"),
      ]);

      if (payRes.data.success) setSummary(payRes.data);
      if (polRes.data.success) setPolicy(polRes.data.policy);
      if (staffRes.data.success) setStaffList(staffRes.data.staff || []);
      if (advRes.data.success) setAdvances(advRes.data.advances || []);
    } catch (error) {
      toast.error("Unable to load payroll data");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      const response = await api.post("/api/payroll/process", { month, year });
      if (response.data.success) {
        toast.success("Payroll calculated & generated for all staff");
        fetchPayrollData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to generate payroll");
    }
  };

  const handleApprovePayroll = async () => {
    if (!summary?.period?._id) return;
    try {
      const response = await api.patch(`/api/payroll/${summary.period._id}/approve`);
      if (response.data.success) {
        toast.success("Payroll records approved");
        fetchPayrollData();
      }
    } catch (error) {
      toast.error("Failed to approve payroll");
    }
  };

  const handleLockPayroll = async () => {
    if (!summary?.period?._id) return;
    try {
      const response = await api.patch(`/api/payroll/${summary.period._id}/lock`);
      if (response.data.success) {
        toast.success("Payroll period locked");
        fetchPayrollData();
      }
    } catch (error) {
      toast.error("Failed to lock payroll");
    }
  };

  const handlePaySalary = async (recordId) => {
    try {
      const response = await api.patch(`/api/payroll/${recordId}/pay`);
      if (response.data.success) {
        toast.success("Salary paid! Treasury updated & PDF payslip generated.");
        fetchPayrollData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Salary payment failed");
    }
  };

  const handleSaveStructure = async () => {
    if (!structureForm.staffId || !structureForm.basicSalary) {
      toast.error("Please select staff and enter basic salary");
      return;
    }
    try {
      const response = await api.post("/api/payroll/salary-structure", structureForm);
      if (response.data.success) {
        toast.success("Salary structure saved");
        setIsStructureModalOpen(false);
        fetchPayrollData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save salary structure");
    }
  };

  const handleSaveAdjustment = async () => {
    if (!adjustmentForm.staffId || !adjustmentForm.title || !adjustmentForm.amount) {
      toast.error("Please fill in adjustment details");
      return;
    }
    try {
      const response = await api.post("/api/payroll/adjustment", {
        ...adjustmentForm,
        payrollPeriodId: summary?.period?._id,
      });
      if (response.data.success) {
        toast.success("One-time adjustment added");
        setIsAdjustmentModalOpen(false);
        fetchPayrollData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add adjustment");
    }
  };

  const handleApproveAdvance = async (advanceId) => {
    try {
      const response = await api.patch(`/api/payroll/advance/${advanceId}/approve`);
      if (response.data.success) {
        toast.success("Salary advance approved");
        fetchPayrollData();
      }
    } catch (error) {
      toast.error("Failed to approve advance");
    }
  };

  const exportReport = (type) => {
    toast.success(`Exporting Payroll Report as ${type.toUpperCase()}...`);
  };

  return (
    <PageShell
      title="Enterprise Payroll Engine"
      subtitle="Automated Salary Generation, Policy Engine, Treasury Integration & PDF Payslips"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePayroll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          >
            <TrendingUp size={16} /> Run Payroll Calculation
          </button>
        </div>
      }
    >
      {/* Date Filter & Period Control */}
      <GlassCard className="p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">Payroll Cycle:</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {summary?.period && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Period Status: <span className="text-emerald-400">{summary.period.status}</span>
            </span>
          )}
          {summary?.period?.status === "Processing" && (
            <button
              onClick={handleApprovePayroll}
              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-xl"
            >
              Approve All
            </button>
          )}
          {summary?.period?.status !== "Locked" && (
            <button
              onClick={handleLockPayroll}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1"
            >
              <Lock size={12} /> Lock Period
            </button>
          )}
        </div>
      </GlassCard>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Staff Count</span>
            <Users size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-white">{summary?.totalRecords || 0}</p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Gross</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <p className="text-xl font-bold mt-2 text-emerald-400">
            ₹{(summary?.totalGross || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Net Pay</span>
            <CreditCard size={16} className="text-blue-400" />
          </div>
          <p className="text-xl font-bold mt-2 text-blue-400">
            ₹{(summary?.totalNet || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overtime Cost</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <p className="text-xl font-bold mt-2 text-amber-400">
            ₹{(summary?.totalOvertime || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Leave Deductions</span>
            <TrendingUp size={16} className="text-rose-400" />
          </div>
          <p className="text-xl font-bold mt-2 text-rose-400">
            ₹{(summary?.totalDeductions || 0).toLocaleString("en-IN")}
          </p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Advances Active</span>
            <Building2 size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-bold mt-2 text-purple-400">
            {advances.filter((a) => a.status === "Approved").length}
          </p>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("processing")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "processing" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Payroll Processing ({summary?.records?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("structures")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "structures" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Salary Structures
        </button>
        <button
          onClick={() => setActiveTab("policy")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "policy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Payroll Policy Engine
        </button>
        <button
          onClick={() => setActiveTab("adjustments")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "adjustments" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          One-Time Adjustments & Advances
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "reports" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-800"
          }`}
        >
          Reports & Exports
        </button>
      </div>

      {/* TAB 1: Payroll Processing */}
      {activeTab === "processing" && (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase">
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Work / Leave</th>
                  <th className="py-3.5 px-4">Basic + Allowances</th>
                  <th className="py-3.5 px-4">OT / Additions</th>
                  <th className="py-3.5 px-4">Deductions</th>
                  <th className="py-3.5 px-4">Net Payable</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {summary?.records?.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">
                      {record.staffId?.fullName}
                      <p className="text-slate-400 text-[11px]">{record.staffId?.employeeCode}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-200">{record.presentDays} Days Present</p>
                      <p className="text-slate-400 text-[11px]">{record.unpaidLeaveDays} Unpaid Leave</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-200">₹{(record.basicSalary || 0).toLocaleString("en-IN")}</p>
                      <p className="text-slate-400 text-[11px]">+ ₹{(record.allowances || 0).toLocaleString("en-IN")} Allowances</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-emerald-400">+ ₹{(record.overtimeEarnings || 0).toLocaleString("en-IN")} Overtime</p>
                      {record.adjustmentsAddition > 0 && <p className="text-blue-400 text-[11px]">+ ₹{record.adjustmentsAddition} Bonus</p>}
                    </td>

                    <td className="py-3 px-4 text-rose-400">
                      - ₹{(record.deductions || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4 font-extrabold text-base text-emerald-400">
                      ₹{(record.netSalary || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-3 px-4">
                      <StatusPill tone={record.status === "Paid" ? "success" : record.status === "Approved" ? "accent" : "warning"}>
                        {record.status}
                      </StatusPill>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {record.status !== "Paid" ? (
                        <button
                          onClick={() => handlePaySalary(record._id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition"
                        >
                          Execute Payment
                        </button>
                      ) : (
                        <button
                          onClick={() => window.open(`/api/payroll/payslip/${record._id}`, "_blank")}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1 justify-end ml-auto"
                        >
                          <Download size={14} /> Payslip PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* TAB 2: Salary Structures */}
      {activeTab === "structures" && (
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Staff Salary Structures</h3>
              <p className="text-xs text-slate-400">Configure basic salary, allowances, statutory PF/ESI, and payment bank accounts</p>
            </div>
            <button
              onClick={() => setIsStructureModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus size={16} /> Define Structure
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => (
              <div key={staff._id} className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{staff.fullName}</h4>
                    <p className="text-xs text-slate-400">{staff.designation} ({staff.employeeCode})</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-bold">
                    {staff.userId?.role}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basic Salary:</span>
                    <span className="font-bold">₹{(staff.salary || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Mode:</span>
                    <span>Bank Transfer</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* TAB 3: Policy Engine */}
      {activeTab === "policy" && policy && (
        <GlassCard className="p-6 max-w-3xl">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Sliders size={18} className="text-emerald-400" /> Active Payroll Policy Rules
          </h3>
          <p className="text-xs text-slate-400 mb-6">Version-controlled policy configuration applied to monthly salary calculations</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-slate-400 block mb-0.5">Salary Calculation Type</span>
              <span className="font-bold text-white">{policy.salaryCalculationType}</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-slate-400 block mb-0.5">Overtime Multiplier</span>
              <span className="font-bold text-emerald-400">{policy.overtimeMultiplier}x Hourly Rate</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-slate-400 block mb-0.5">Late Deduction Policy</span>
              <span className="font-bold text-white">{policy.lateDeductionPolicy}</span>
            </div>
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-slate-400 block mb-0.5">Grace Period</span>
              <span className="font-bold text-white">{policy.graceMinutes} minutes</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* TAB 4: Adjustments & Advances */}
      {activeTab === "adjustments" && (
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white">One-Time Adjustments & Pending Advances</h3>
              <p className="text-xs text-slate-400">Add festival bonuses, uniform fines, or manage salary advance claims</p>
            </div>
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus size={16} /> Add Adjustment
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">Pending Salary Advances</h4>
            {advances.filter((a) => a.status === "Pending").length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No pending salary advance requests.</p>
            ) : (
              advances
                .filter((a) => a.status === "Pending")
                .map((adv) => (
                  <div key={adv._id} className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{adv.staffId?.fullName} ({adv.staffId?.employeeCode})</p>
                      <p className="text-slate-400">Amount: ₹{adv.amount} | Reason: {adv.reason}</p>
                    </div>
                    <button
                      onClick={() => handleApproveAdvance(adv._id)}
                      className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg"
                    >
                      Approve Advance
                    </button>
                  </div>
                ))
            )}
          </div>
        </GlassCard>
      )}

      {/* TAB 5: Reports & Exports */}
      {activeTab === "reports" && (
        <GlassCard className="p-6">
          <h3 className="text-base font-bold text-white mb-2">Export Payroll Reports</h3>
          <p className="text-xs text-slate-400 mb-6">Download comprehensive monthly payroll summaries and tax ledgers</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-center">
              <FileText size={24} className="mx-auto text-emerald-400 mb-2" />
              <h4 className="font-bold text-white text-sm">PDF Register</h4>
              <p className="text-[11px] text-slate-400 mb-4">Official monthly payroll summary document</p>
              <button onClick={() => exportReport("pdf")} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl w-full">
                Download PDF
              </button>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-center">
              <FileSpreadsheet size={24} className="mx-auto text-blue-400 mb-2" />
              <h4 className="font-bold text-white text-sm">Excel Sheet</h4>
              <p className="text-[11px] text-slate-400 mb-4">Full employee earnings & deductions matrix</p>
              <button onClick={() => exportReport("excel")} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl w-full">
                Download Excel (.xlsx)
              </button>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-center">
              <Download size={24} className="mx-auto text-purple-400 mb-2" />
              <h4 className="font-bold text-white text-sm">CSV Data Export</h4>
              <p className="text-[11px] text-slate-400 mb-4">Raw bank payout format for online transfer</p>
              <button onClick={() => exportReport("csv")} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl w-full">
                Export CSV
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Create Salary Structure Modal */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-4">Define Salary Structure</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 mb-1 block">Staff Member</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  value={structureForm.staffId}
                  onChange={(e) => setStructureForm({ ...structureForm, staffId: e.target.value })}
                >
                  <option value="">Select Staff</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName} ({s.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Basic Salary (₹ / month)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="25000"
                  value={structureForm.basicSalary}
                  onChange={(e) => setStructureForm({ ...structureForm, basicSalary: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 mb-1 block">HRA (₹)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="5000"
                    value={structureForm.houseRentAllowance}
                    onChange={(e) => setStructureForm({ ...structureForm, houseRentAllowance: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-slate-300 mb-1 block">Provident Fund (₹)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                    placeholder="1800"
                    value={structureForm.providentFund}
                    onChange={(e) => setStructureForm({ ...structureForm, providentFund: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsStructureModalOpen(false)} className="px-4 py-2 bg-slate-800 text-xs rounded-xl">Cancel</button>
              <button onClick={handleSaveStructure} className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">Save Structure</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-4">Add One-Time Adjustment</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 mb-1 block">Staff Member</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  value={adjustmentForm.staffId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, staffId: e.target.value })}
                >
                  <option value="">Select Staff</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName} ({s.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Type</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  value={adjustmentForm.type}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                >
                  <option value="Addition">Addition (Bonus / Incentive)</option>
                  <option value="Deduction">Deduction (Fine / Uniform)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="e.g. Diwali Festival Bonus"
                  value={adjustmentForm.title}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-slate-300 mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  placeholder="2000"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="px-4 py-2 bg-slate-800 text-xs rounded-xl">Cancel</button>
              <button onClick={handleSaveAdjustment} className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">Save Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
