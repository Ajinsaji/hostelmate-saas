import { CheckCircle2, AlertCircle, Clock, Plus, Trash2, Upload, Receipt, Info, FileText, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import BottomNav from "../components/BottomNav";
import useGlobalPolling from "../hooks/useGlobalPolling";

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

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1 mb-2">Payments</h1>
        <p style={{ opacity: 0.8 }}>Track rent and dues</p>
        
        <div style={{ position: "absolute", bottom: "-20px", right: "20px" }}>
          <button 
            className="btn-icon" 
            style={{ width: "56px", height: "56px", background: "var(--accent)" }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={24} color="var(--primary-dark)" />
          </button>
        </div>
      </div>

      <div className="p-4 flex-col gap-4">
        {/* ADD PAYMENT FORM */}
        {showAddForm && (
          <div className="card animate-slide-up mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2">Record Payment</h2>
              <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => setShowAddForm(false)}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <span className="input-label">Resident</span>
                <select name="residentId" className="input-field" value={formData.residentId} onChange={handleResidentChange} required>
                  <option value="">Select Resident</option>
                  {residents.map(r => (
                    <option key={r._id} value={r._id}>{r.name} (Room {r.roomId?.roomNumber || '?'})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Month</span>
                  <input type="month" name="month" className="input-field" value={formData.month} onChange={handleChange} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Total Rent Due (₹)</span>
                  <input name="totalRent" type="number" className="input-field" value={formData.totalRent} onChange={handleChange} required />
                </div>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Method</span>
                  <select name="paymentMethod" className="input-field" value={formData.paymentMethod} onChange={handleChange} required>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Total Paid (₹)</span>
                  <input
                    name="amount"
                    type="number"
                    className="input-field"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    disabled={formData.paymentMethod === "partial"}
                    style={formData.paymentMethod === "partial" ? { opacity: 0.75 } : undefined}
                  />
                </div>
              </div>

              {formData.paymentMethod === "partial" && (
                <div className="flex gap-4 mb-4">
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <span className="input-label">Cash Amount (₹)</span>
                    <input
                      name="cashAmount"
                      type="number"
                      className="input-field"
                      value={formData.cashAmount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <span className="input-label">Online Amount (₹)</span>
                    <input
                      name="onlineAmount"
                      type="number"
                      className="input-field"
                      value={formData.onlineAmount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              <label className="input-group mb-6 hover:border-primary" style={{ padding: "16px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: "12px", textAlign: "center", cursor: "pointer" }}>
                <Upload size={20} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                <span className="text-small">{proofFile ? proofFile.name : "Upload Payment Proof (Optional)"}</span>
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateUploadFile(file, ["image/png", "image/jpeg", "image/jpg", ".pdf"], 5 * 1024 * 1024)) {
                      setProofFile(file);
                    }
                  }}
                />
              </label>

              <button type="submit" className="btn-primary" disabled={savingPayment} style={{ cursor: savingPayment ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: savingPayment ? 0.7 : 1 }}>
                {savingPayment ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {savingPayment ? "Saving..." : "Add Payment Record"}
              </button>
            </form>
          </div>
        )}

        {loading && <p className="text-body text-center">Loading payments...</p>}

        {!loading && payments.length === 0 && !showAddForm && (
          <div className="text-center pt-8 pb-8">
            <Receipt size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: "16px", margin: "0 auto" }} />
            <p className="text-body mt-4">No payment records found.<br/>Click + to add a payment.</p>
          </div>
        )}

        {!loading && payments.map((payment) => {
          const { totalRent, paid, balance, status } = calcTotals(payment);
          const residentName = payment.residentId?.name || "Unknown Resident";

          return (
            <div key={payment._id} className="card animate-slide-up mb-4" style={{ padding: "16px" }}>
              <div
                className="flex justify-between items-center mb-4 pb-4"
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <div>
                  <h3 className="text-h2" style={{ marginBottom: 4 }}>{residentName}</h3>
                  <p className="text-small flex items-center gap-2">
                    <FileText size={14} /> Month: {payment.month || "N/A"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {status === "paid" && <span className="badge badge-paid"><CheckCircle2 size={12} /> Paid</span>}
                  {status === "partial" && <span className="badge badge-partial"><Clock size={12} /> Partial</span>}
                  {status === "pending" && <span className="badge badge-pending"><AlertCircle size={12} /> Pending</span>}
                  
                  <button onClick={() => deletePayment(payment._id)} className="btn-icon" style={{ width: 28, height: 28, background: "rgba(239, 68, 68, 0.1)", color: "var(--status-pending)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-small">Total Due</p>
                  <p className="text-h3">₹{totalRent}</p>
                </div>
                <div className="text-center">
                  <p className="text-small">Paid</p>
                  <p className="text-h3" style={{ color: "var(--status-paid)" }}>₹{paid}</p>
                </div>
                <div className="text-right">
                  <p className="text-small">Balance</p>
                  <p className="text-h3" style={{ color: balance > 0 ? "var(--status-pending)" : "var(--text-main)" }}>
                    ₹{Math.max(0, balance)}
                  </p>
                </div>
              </div>

              {/* Payment History Entries */}
              {payment.entries?.length > 0 && (
                <div style={{ background: "var(--bg-color)", borderRadius: 12, padding: 12, marginTop: 12 }}>
                  <p className="text-small mb-2 flex items-center gap-1" style={{ fontWeight: 600 }}>
                    <Info size={14} /> Payment History
                  </p>
                  {payment.entries.map(entry => (
                    <div key={entry._id} className="flex justify-between items-center py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>₹{entry.amount} via {entry.method}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        {entry.verified ? (
                          <span className="badge badge-paid" style={{ fontSize: 10, padding: "2px 6px" }}>Verified</span>
                        ) : (
                          <button 
                            onClick={() => verifyEntry(payment._id, entry._id)}
                            style={{ fontSize: 11, padding: "4px 8px", background: "var(--primary-light)", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}

export default Payments;
