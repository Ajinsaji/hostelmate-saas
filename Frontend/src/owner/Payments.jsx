import { CheckCircle2, AlertCircle, Clock, Plus, Trash2, Upload, Receipt, Info, FileText, Save, Loader2, IndianRupee, Wallet, BadgeCheck, TrendingUp } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import BottomNav from "../components/BottomNav";
import useGlobalPolling from "../hooks/useGlobalPolling";
import { PageShell, GlassCard, StatCard, StatusPill, EmptyState, PREMIUM_THEME } from "./PremiumUI";

function Payments() {
  // UI-only redesign per spec (no logic changes)

  const [payments, setPayments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [formData, setFormData] = useState({
    residentId: "",
    month: "",
    amount: "",
    method: "UPI",
    totalRent: "",
    paymentMethod: "cash", // cash | online | partial
    cashAmount: "",
    onlineAmount: "",
  });
  const [proofFile, setProofFile] = useState(null);

  const validateUploadFile = (file, allowedTypes, maxBytes) => {
    if (!file) return true;
    if (maxBytes && file.size > maxBytes) {
      toast.error(`File must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB`);
      return false;
    }
    if (allowedTypes && !allowedTypes.some((type) => file.type === type || file.name.toLowerCase().endsWith(type))) {
      toast.error("Unsupported file type. Use PNG, JPG, JPEG, or PDF.");
      return false;
    }
    return true;
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/payments/hostel");
      setPayments(res.data?.payments || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await api.get("/api/residents/hostel");
      setResidents(res.data?.residents || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load residents");
    }

  };

  const safeRefreshProps = {
    isEditing: showAddForm,
    isSubmitting: savingPayment,
    showModal: showAddForm,
    isUploading: Boolean(proofFile),
  };

  useGlobalPolling(async () => {
    await Promise.all([fetchPayments(), fetchResidents()]);
  }, { interval: 9000, safeProps: safeRefreshProps });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
        // Auto-calculate amount if partial payment method
        if (updated.paymentMethod === "partial") {
          const cash = parseInt(updated.cashAmount || 0, 10);
          const online = parseInt(updated.onlineAmount || 0, 10);
          updated.amount = cash + online;
        }

      return updated;
    });
  };

  const handleResidentChange = (e) => {
    const rId = e.target.value;
    const resident = residents.find(r => r._id === rId);
    setFormData({ ...formData, residentId: rId, totalRent: resident?.monthlyRent || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (savingPayment) return;

    // Basic validation
    if (!formData.residentId) return toast.error("Resident is required");
    if (!formData.month) return toast.error("Month is required");
    if (!formData.totalRent) return toast.error("Total rent is required");

    const amountNum = Number(formData.amount);
    const totalRentNum = Number(formData.totalRent);
    if (!Number.isFinite(amountNum) || amountNum <= 0) return toast.error("Payment amount must be greater than 0");
    if (!Number.isFinite(totalRentNum) || totalRentNum <= 0) return toast.error("Total rent must be greater than 0");

    // Prevent invalid partial calculations from UI
    if (formData.paymentMethod === "partial") {
      const cash = Number(formData.cashAmount || 0);
      const online = Number(formData.onlineAmount || 0);
      if (cash <= 0 && online <= 0) return toast.error("Cash/Online amounts must be greater than 0 for partial payments");
      if (amountNum !== cash + online) return toast.error("Partial amounts do not match total paid");
    }

    // Prevent paid > total due for this month (per record)
    if (amountNum > totalRentNum) return toast.error("Payment amount cannot be greater than total due");

    try {
      setSavingPayment(true);
      if (proofFile && !validateUploadFile(proofFile, ["image/png", "image/jpeg", "image/jpg", ".pdf"], 5 * 1024 * 1024)) {
        return;
      }

      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      if (proofFile) data.append("proof", proofFile);

      await api.post("/api/payments/create", data);
      toast.success("Payment added successfully");
      setShowAddForm(false);
      setFormData({ residentId: "", month: "", amount: "", method: "UPI", totalRent: "", paymentMethod: "cash", cashAmount: "", onlineAmount: "" });
      setProofFile(null);
      fetchPayments();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error adding payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const verifyEntry = async (paymentId, entryId) => {
    try {
      await api.put(`/api/payments/verify/${paymentId}/${entryId}`);
      toast.success("Payment Verified");
      fetchPayments();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Verification failed");
    }
  };

  const deletePayment = async (paymentId) => {
    try {
      await api.delete(`/api/payments/delete/${paymentId}`);
      toast.success("Payment deleted");
      fetchPayments();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error deleting payment");
    }
  };

  const calcTotals = (payment) => {
    const totalRent = Number(payment.totalRent || 0);
    const entries = Array.isArray(payment.entries) ? payment.entries : [];
    const paid = entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const balance = totalRent - paid;
    const status = payment.status || (balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending");
    return { totalRent, paid, balance, status };
  };

  const summary = useMemo(() => {
    const totals = payments.reduce(
      (acc, payment) => {
        const { totalRent, paid, balance, status } = calcTotals(payment);
        acc.collected += paid;
        acc.due += totalRent;
        acc.pending += balance;
        acc.overdue += status === "pending" ? balance : 0;
        return acc;
      },
      { collected: 0, due: 0, pending: 0, overdue: 0 }
    );
    return totals;
  }, [payments]);

  return (
    <PageShell
      title="Payments"
      subtitle="Finance overview for rent, dues, and payment health"
      action={
        <button onClick={() => setShowAddForm(!showAddForm)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018" }}>
          <Plus size={16} /> Record payment
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected" value={`₹${summary.collected.toLocaleString("en-IN")}`} caption="Total payments received" icon={<IndianRupee size={18} />} />
        <StatCard label="Pending" value={`₹${summary.pending.toLocaleString("en-IN")}`} caption="Outstanding balance" icon={<Wallet size={18} />} tone="blue" />
        <StatCard label="Overdue" value={`₹${summary.overdue.toLocaleString("en-IN")}`} caption="Needs follow-up" icon={<AlertCircle size={18} />} tone="blue" />
        <StatCard label="Monthly income" value={`₹${summary.due.toLocaleString("en-IN")}`} caption="Projected rent this month" icon={<TrendingUp size={18} />} />
      </div>

      <GlassCard>
        {showAddForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Record payment</p>
                <h3 className="mt-1 text-lg font-semibold">Add a new payment entry</h3>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} onClick={() => setShowAddForm(false)}>
                <Trash2 size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Resident</p>
                  <select name="residentId" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.residentId} onChange={handleResidentChange} required style={{ color: PREMIUM_THEME.text }}>
                    <option value="">Select resident</option>
                    {residents.map((r) => (<option key={r._id} value={r._id}>{r.name} • Room {r.roomId?.roomNumber || "?"}</option>))}
                  </select>
                </div>
                <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Month</p>
                  <input type="month" name="month" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.month} onChange={handleChange} required style={{ color: PREMIUM_THEME.text }} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Method</p>
                  <select name="paymentMethod" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.paymentMethod} onChange={handleChange} required style={{ color: PREMIUM_THEME.text }}>
                    <option value="cash">Cash</option><option value="online">Online</option><option value="partial">Partial</option>
                  </select>
                </div>
                <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Total rent</p>
                  <input name="totalRent" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.totalRent} onChange={handleChange} required style={{ color: PREMIUM_THEME.text }} />
                </div>
              </div>
              {formData.paymentMethod === "partial" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Cash</p>
                    <input name="cashAmount" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.cashAmount} onChange={handleChange} required style={{ color: PREMIUM_THEME.text }} />
                  </div>
                  <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Online</p>
                    <input name="onlineAmount" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.onlineAmount} onChange={handleChange} required style={{ color: PREMIUM_THEME.text }} />
                  </div>
                </div>
              ) : (
                <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Paid amount</p>
                  <input name="amount" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.amount} onChange={handleChange} required style={{ color: PREMIUM_THEME.text }} />
                </div>
              )}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed p-4 text-center" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                <Upload size={18} style={{ color: PREMIUM_THEME.primary }} />
                <span className="mt-2 text-sm">{proofFile ? proofFile.name : "Upload payment proof (optional)"}</span>
                <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file && validateUploadFile(file, ["image/png", "image/jpeg", "image/jpg", ".pdf"], 5 * 1024 * 1024)) setProofFile(file); }} />
              </label>
              <button type="submit" disabled={savingPayment} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: PREMIUM_THEME.primary, color: "#031018", opacity: savingPayment ? 0.7 : 1 }}>
                {savingPayment ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {savingPayment ? "Saving..." : "Add payment"}
              </button>
            </form>
          </div>
        ) : null}
      </GlassCard>

      {loading ? <GlassCard className="text-center">Loading payments...</GlassCard> : payments.length === 0 ? <EmptyState title="No payments yet" message="Record a payment to establish a finance trail." /> : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const { totalRent, paid, balance, status } = calcTotals(payment);
            const residentName = payment.residentId?.name || "Unknown Resident";
            return (
              <GlassCard key={payment._id} hover>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{residentName}</h3>
                      <StatusPill tone={status === "paid" ? "success" : status === "partial" ? "warning" : "danger"}>{status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Pending"}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}><span className="inline-flex items-center gap-1"><FileText size={14} /> {payment.month || "N/A"}</span></p>
                    <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>Room {payment.residentId?.roomId?.roomNumber || "—"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => deletePayment(payment._id)} className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(235,87,87,0.14)", color: PREMIUM_THEME.danger }}>
                      <Trash2 size={14} className="mr-1 inline" /> Delete
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[16px] border p-3" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-sm" style={{ color: PREMIUM_THEME.muted }}>Due</p>
                    <p className="mt-2 font-semibold">₹{totalRent}</p>
                  </div>
                  <div className="rounded-[16px] border p-3" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-sm" style={{ color: PREMIUM_THEME.muted }}>Paid</p>
                    <p className="mt-2 font-semibold" style={{ color: PREMIUM_THEME.primary }}>₹{paid}</p>
                  </div>
                  <div className="rounded-[16px] border p-3" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-sm" style={{ color: PREMIUM_THEME.muted }}>Remaining</p>
                    <p className="mt-2 font-semibold" style={{ color: balance > 0 ? PREMIUM_THEME.warning : PREMIUM_THEME.text }}>₹{Math.max(0, balance)}</p>
                  </div>
                </div>
                {payment.entries?.length > 0 ? (
                  <div className="mt-4 rounded-[16px] border p-3" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-sm font-semibold">Payment history</p>
                    <div className="mt-3 space-y-2">
                      {payment.entries.map((entry) => (
                        <div key={entry._id} className="flex items-center justify-between rounded-[12px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border }}>
                          <div>
                            <p className="text-sm font-medium">₹{entry.amount} via {entry.method}</p>
                            <p className="text-xs" style={{ color: PREMIUM_THEME.muted }}>{new Date(entry.createdAt).toLocaleDateString()}</p>
                          </div>
                          {entry.verified ? <StatusPill tone="success">Verified</StatusPill> : <button onClick={() => verifyEntry(payment._id, entry._id)} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: PREMIUM_THEME.primary }}>Verify</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </GlassCard>
            );
          })}
        </div>
      )}
      <BottomNav />
    </PageShell>
  );
}

export default Payments;
