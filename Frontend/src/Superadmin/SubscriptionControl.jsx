import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, XCircle, CreditCard, Edit2, Shield, Calendar, Users, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";

import SuperadminBottomNav from "../components/SuperadminBottomNav";

function SubscriptionControl() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [editingSub, setEditingSub] = useState(null);
  const [formData, setFormData] = useState({});

  const token = localStorage.getItem("adminToken");

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/admin/subscriptions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(response.data.subscriptions || []);
    } catch (error) {
      toast.error("Failed to load subscriptions");
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleEdit = (sub) => {
    setEditingSub(sub);
    setFormData({
      planType: sub.planType || "Basic",
      subscriptionStatus: sub.subscriptionStatus || "trial",
      isFreeAccess: sub.isFreeAccess || false,
      residentLimit: sub.residentLimit || 60,
      amount: sub.amount || 0,
      subscriptionEndDate: sub.subscriptionEndDate ? new Date(sub.subscriptionEndDate).toISOString().split('T')[0] : ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/subscription/update/${editingSub._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Subscription updated successfully");
      setEditingSub(null);
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to update subscription");
    }
  };

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1 mb-2">Subscription Control</h1>
        <p style={{ opacity: 0.8 }}>Manage limits and access</p>
      </div>

      <div className="p-4 flex-col gap-4">
        {/* EDIT FORM */}
        {editingSub && (
          <div className="card animate-slide-up mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h2">Edit Subscription</h2>
              <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => setEditingSub(null)}>
                <XCircle size={16} />
              </button>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Plan Type</span>
                <select className="input-field" value={formData.planType} onChange={e => setFormData({...formData, planType: e.target.value})}>
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Status</span>
                <select className="input-field" value={formData.subscriptionStatus} onChange={e => setFormData({...formData, subscriptionStatus: e.target.value})}>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Resident Limit</span>
                <input type="number" className="input-field" value={formData.residentLimit} onChange={e => setFormData({...formData, residentLimit: e.target.value})} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <span className="input-label">Paid Amount</span>
                <input type="number" className="input-field" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
            </div>

            <div className="input-group mb-4">
              <span className="input-label">Expiry Date</span>
              <input type="date" className="input-field" value={formData.subscriptionEndDate} onChange={e => setFormData({...formData, subscriptionEndDate: e.target.value})} />
            </div>

            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input type="checkbox" checked={formData.isFreeAccess} onChange={e => setFormData({...formData, isFreeAccess: e.target.checked})} style={{ width: 18, height: 18 }} />
              <span className="text-body" style={{ fontWeight: 500 }}>Free Access (Bypass Expiry)</span>
            </label>

            <button className="btn-primary" onClick={handleUpdate}>Save Changes</button>
          </div>
        )}

        {subscriptions.length === 0 ? (
          <div className="text-center pt-8 pb-8">
            <Shield size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: "16px", margin: "0 auto" }} />
            <p className="text-body mt-4">No Subscriptions Found</p>
          </div>
        ) : (
          subscriptions.map((s) => (
            <div key={s._id} className="card animate-slide-up mb-4">
              <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(37, 211, 102, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--primary)" }}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 className="text-h3" style={{ marginBottom: 2 }}>{s.hostelId?.hostelName || "Hostel"}</h3>
                    <p className="text-small">Owner: {s.hostelId?.ownerName || "N/A"}</p>
                  </div>
                </div>
                <span className={`badge ${s.subscriptionStatus === 'active' ? 'badge-paid' : s.subscriptionStatus === 'trial' ? 'badge-partial' : 'badge-pending'}`}>
                  {s.subscriptionStatus?.toUpperCase()}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="flex items-center gap-2 text-small">
                  <Shield size={16} color="var(--primary)" /> Plan: {s.planType}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <IndianRupee size={16} color="var(--primary)" /> Paid: ₹{s.amount}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <Users size={16} color="var(--primary)" /> Limit: {s.residentLimit}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <Calendar size={16} color="var(--primary)" />
                  Ends: {s.subscriptionEndDate ? new Date(s.subscriptionEndDate).toLocaleDateString() : "Trial/Free"}
                </div>
              </div>

              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
                <button className="btn-secondary" style={{ padding: "8px", fontSize: "14px" }} onClick={() => handleEdit(s)}>
                  <Edit2 size={16} /> Manage Subscription
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <SuperadminBottomNav />
    </div>
  );
}

export default SubscriptionControl;
