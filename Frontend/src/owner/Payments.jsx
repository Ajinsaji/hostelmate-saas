import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { KPICard } from "../design-system/components/KPICard";
import { StatusPill } from "../design-system/components/StatusPill";
import { EmptyState } from "../design-system/components/EmptyState";
import { Button } from "../design-system/components/Button";
import { AlertCircle, Plus, Trash2, Upload, FileText, Save, Loader2, IndianRupee, Wallet, TrendingUp } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import useGlobalPolling from "../hooks/useGlobalPolling";
import { useCurrentHostel } from "../contexts/HostelContext";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";

function PaymentTable({ payments, deletePayment, calcTotals }) {
  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: '#22304A', background: '#162032' }}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: '#22304A', background: 'rgba(255,255,255,0.02)' }}>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Resident</th>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Month</th>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Rent Summary</th>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Status</th>
            <th className="p-4 text-xs font-bold text-slate-400 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => {
            const { totalRent, paid, balance, status } = calcTotals(payment);
            const residentName = payment.residentId?.name || "Unknown Resident";
            return (
              <tr key={payment._id} className="border-b hover:bg-white/5 transition" style={{ borderColor: '#22304A' }}>
                <td className="p-4">
                  <div className="font-semibold text-white">{residentName}</div>
                  <div className="text-xs text-slate-400">Room {payment.residentId?.roomId?.roomNumber || "—"}</div>
                </td>
                <td className="p-4 text-sm text-white">{payment.month || '—'}</td>
                <td className="p-4 text-sm text-white">
                  <div className="flex gap-4">
                    <div><span className="text-slate-400">Due:</span> ₹{totalRent}</div>
                    <div><span className="text-slate-400">Paid:</span> <span className="text-emerald-400 font-bold">₹{paid}</span></div>
                    <div><span className="text-slate-400">Remaining:</span> <span className="text-amber-400 font-bold">₹{Math.max(0, balance)}</span></div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => deletePayment(payment._id)} size="sm">Delete</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Payments() {
  const { colors } = useTheme();
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;

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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
      fetchResidents();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeHostelId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
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

    if (!formData.residentId) return toast.error("Resident is required");
    if (!formData.month) return toast.error("Month is required");
    if (!formData.totalRent) return toast.error("Total rent is required");

    const amountNum = Number(formData.amount);
    const totalRentNum = Number(formData.totalRent);
    if (!Number.isFinite(amountNum) || amountNum <= 0) return toast.error("Payment amount must be greater than 0");
    if (!Number.isFinite(totalRentNum) || totalRentNum <= 0) return toast.error("Total rent must be greater than 0");

    if (formData.paymentMethod === "partial") {
      const cash = Number(formData.cashAmount || 0);
      const online = Number(formData.onlineAmount || 0);
      if (cash <= 0 && online <= 0) return toast.error("Cash/Online amounts must be greater than 0 for partial payments");
      if (amountNum !== cash + online) return toast.error("Partial amounts do not match total paid");
    }

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
    <OwnerLayout>
      <PageContainer
        title="Payments"
        subtitle="Finance overview for rent, dues, and payment health"
        action={
          <button onClick={() => setShowAddForm(!showAddForm)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: colors.accent.primary, color: "#031018" }}>
            <Plus size={16} /> Record payment
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard label="Collected" value={`₹${summary.collected.toLocaleString("en-IN")}`} caption="Total payments received" icon={<IndianRupee size={18} />} />
          <KPICard label="Pending" value={`₹${summary.pending.toLocaleString("en-IN")}`} caption="Outstanding balance" icon={<Wallet size={18} />} tone="blue" />
          <KPICard label="Overdue" value={`₹${summary.overdue.toLocaleString("en-IN")}`} caption="Needs follow-up" icon={<AlertCircle size={18} />} tone="blue" />
          <KPICard label="Monthly income" value={`₹${summary.due.toLocaleString("en-IN")}`} caption="Projected rent this month" icon={<TrendingUp size={18} />} />
        </div>

        <Card>
          {showAddForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Record payment</p>
                  <h3 className="mt-1 text-lg font-semibold">Add a new payment entry</h3>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} onClick={() => setShowAddForm(false)}>
                  <Trash2 size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Resident</p>
                    <select name="residentId" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.residentId} onChange={handleResidentChange} required style={{ color: colors.text.primary }}>
                      <option value="">Select resident</option>
                      {residents.map((r) => (<option key={r._id} value={r._id}>{r.name} • Room {r.roomId?.roomNumber || "?"}</option>))}
                    </select>
                  </div>
                  <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Month</p>
                    <input type="month" name="month" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.month} onChange={handleChange} required style={{ color: colors.text.primary }} />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Method</p>
                    <select name="paymentMethod" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.paymentMethod} onChange={handleChange} required style={{ color: colors.text.primary }}>
                      <option value="cash">Cash</option><option value="online">Online</option><option value="partial">Partial</option>
                    </select>
                  </div>
                  <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Total rent</p>
                    <input name="totalRent" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.totalRent} onChange={handleChange} required style={{ color: colors.text.primary }} />
                  </div>
                </div>
                {formData.paymentMethod === "partial" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Cash</p>
                      <input name="cashAmount" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.cashAmount} onChange={handleChange} required style={{ color: colors.text.primary }} />
                    </div>
                    <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Online</p>
                      <input name="onlineAmount" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.onlineAmount} onChange={handleChange} required style={{ color: colors.text.primary }} />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[16px] border px-3 py-2" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: colors.text.muted }}>Paid amount</p>
                    <input name="amount" type="number" className="mt-1 w-full bg-transparent text-sm outline-none" value={formData.amount} onChange={handleChange} required style={{ color: colors.text.primary }} />
                  </div>
                )}
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed p-4 text-center" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                  <Upload size={18} style={{ color: colors.accent.primary }} />
                  <span className="mt-2 text-sm">{proofFile ? proofFile.name : "Upload payment proof (optional)"}</span>
                  <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file && validateUploadFile(file, ["image/png", "image/jpeg", "image/jpg", ".pdf"], 5 * 1024 * 1024)) setProofFile(file); }} />
                </label>
                <button type="submit" disabled={savingPayment} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: colors.accent.primary, color: "#031018", opacity: savingPayment ? 0.7 : 1 }}>
                  {savingPayment ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {savingPayment ? "Saving..." : "Add payment"}
                </button>
              </form>
            </div>
          ) : null}
        </Card>

        {loading ? <Card className="text-center">Loading payments...</Card> : payments.length === 0 ? <EmptyState title="No payments yet" message="Record a payment to establish a finance trail." /> : (
          <>
            {isMobile ? (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const { totalRent, paid, balance, status } = calcTotals(payment);
                  const residentName = payment.residentId?.name || "Unknown Resident";
                  return (
                    <Card key={payment._id} hover>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{residentName}</h3>
                            <StatusPill tone={status === "paid" ? "success" : status === "partial" ? "warning" : "danger"}>{status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Pending"}</StatusPill>
                          </div>
                          <p className="mt-1 text-sm" style={{ color: colors.text.muted }}><span className="inline-flex items-center gap-1"><FileText size={14} /> {payment.month || "N/A"}</span></p>
                          <p className="mt-1 text-sm" style={{ color: colors.text.muted }}>Room {payment.residentId?.roomId?.roomNumber || "—"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => deletePayment(payment._id)} className="rounded-full px-3 py-2 text-sm font-semibold" style={{ background: "rgba(235,87,87,0.14)", color: colors.accent.danger }}>
                            <Trash2 size={14} className="mr-1 inline" /> Delete
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[16px] border p-3" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-sm" style={{ color: colors.text.muted }}>Due</p>
                          <p className="mt-2 font-semibold">₹{totalRent}</p>
                        </div>
                        <div className="rounded-[16px] border p-3" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-sm" style={{ color: colors.text.muted }}>Paid</p>
                          <p className="mt-2 font-semibold" style={{ color: colors.accent.primary }}>₹{paid}</p>
                        </div>
                        <div className="rounded-[16px] border p-3" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-sm" style={{ color: colors.text.muted }}>Remaining</p>
                          <p className="mt-2 font-semibold" style={{ color: balance > 0 ? colors.accent.warning : colors.text.primary }}>₹{Math.max(0, balance)}</p>
                        </div>
                      </div>
                      {payment.entries?.length > 0 ? (
                        <div className="mt-4 rounded-[16px] border p-3" style={{ borderColor: colors.border.default, background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-sm font-semibold">Payment history</p>
                          <div className="mt-3 space-y-2">
                            {payment.entries.map((entry) => (
                              <div key={entry._id} className="flex items-center justify-between rounded-[12px] border px-3 py-2" style={{ borderColor: colors.border.default }}>
                                <div>
                                  <p className="text-sm font-medium">₹{entry.amount} via {entry.method}</p>
                                  <p className="text-xs" style={{ color: colors.text.muted }}>{new Date(entry.createdAt).toLocaleDateString()}</p>
                                </div>
                                {entry.verified ? <StatusPill tone="success">Verified</StatusPill> : <button onClick={() => verifyEntry(payment._id, entry._id)} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: colors.accent.primary }}>Verify</button>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <PaymentTable 
                payments={payments}
                deletePayment={deletePayment}
                calcTotals={calcTotals}
              />
            )}
          </>
        )}
      </PageContainer>
    </OwnerLayout>
  );
}

export default Payments;
