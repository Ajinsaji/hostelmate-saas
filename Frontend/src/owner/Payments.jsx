import { CheckCircle2, AlertCircle, Clock, Plus, Trash2, Upload, Receipt, Info, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import BottomNav from "../components/BottomNav";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    residentId: "", month: "", amount: "", method: "UPI", totalRent: ""
  });
  const [proofFile, setProofFile] = useState(null);

  const token = localStorage.getItem("token");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/hostel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data?.payments || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/residents/hostel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidents(res.data?.residents || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchResidents();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleResidentChange = (e) => {
    const rId = e.target.value;
    const resident = residents.find(r => r._id === rId);
    setFormData({ ...formData, residentId: rId, totalRent: resident?.monthlyRent || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.residentId || !formData.month || !formData.amount || !formData.totalRent) {
      return toast.error("Please fill all required fields");
    }

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (proofFile) data.append("proof", proofFile);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/payments/create`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Payment added successfully");
      setShowAddForm(false);
      setFormData({ residentId: "", month: "", amount: "", method: "UPI", totalRent: "" });
      setProofFile(null);
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding payment");
    }
  };

  const verifyEntry = async (paymentId, entryId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/payments/verify/${paymentId}/${entryId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Payment Verified");
      fetchPayments();
    } catch (error) {
      toast.error("Verification failed");
    }
  };

  const deletePayment = async (paymentId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/payments/delete/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Payment deleted");
      fetchPayments();
    } catch (error) {
      toast.error("Error deleting payment");
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
                  <span className="input-label">Amount Paid (₹)</span>
                  <input name="amount" type="number" className="input-field" value={formData.amount} onChange={handleChange} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Method</span>
                  <select name="method" className="input-field" value={formData.method} onChange={handleChange} required>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <label className="input-group mb-6 hover:border-primary" style={{ padding: "16px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: "12px", textAlign: "center", cursor: "pointer" }}>
                <Upload size={20} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                <span className="text-small">{proofFile ? proofFile.name : "Upload Payment Proof (Optional)"}</span>
                <input type="file" style={{ display: "none" }} onChange={(e) => setProofFile(e.target.files[0])} />
              </label>

              <button type="submit" className="btn-primary">
                Add Payment Record
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
