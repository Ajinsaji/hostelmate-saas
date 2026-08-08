import { useTheme } from "../design-system/ThemeProvider";
import { Card } from "../design-system/components/Card";
import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiZap,
  FiUsers,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiFileText,
  FiArrowUpRight,
  FiCreditCard,
  FiCheck,
  FiLayers,
  FiRefreshCw,
  FiDownload,
} from "react-icons/fi";
import toast from "../services/toast";
import { getOwnerToken } from "../utils/authToken";

const OwnerBillingDashboard = () => {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = getOwnerToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, plansRes, histRes] = await Promise.all([
        fetch("/api/owner/subscription/dashboard", { headers }),
        fetch("/api/owner/subscription/plans", { headers }),
        fetch("/api/saas-payments/history", { headers }),
      ]);

      const [dashData, plansData, histData] = await Promise.all([
        dashRes.json(),
        plansRes.json(),
        histRes.json(),
      ]);

      if (dashData.success) setData(dashData);
      if (plansData.success) setPlans(plansData.plans);
      if (histData.success) setHistory(histData.attempts || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleInitiatePayment = async (plan) => {
    try {
      setSelectedPlan(plan);
      setProcessing(true);
      const token = getOwnerToken();

      const res = await fetch("/api/saas-payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan._id }),
      });
      const order = await res.json();
      if (order.success) {
        setOrderData(order);
        setShowCheckoutModal(true);
      } else {
        toast.error(order.message || "Failed to create order");
      }
    } catch (err) {
      toast.error("Order creation error");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!orderData) return;
    try {
      setProcessing(true);
      const token = getOwnerToken();

      const res = await fetch("/api/saas-payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: `pay_${Date.now()}`,
          signature: `sig_${Date.now()}`,
          invoiceId: orderData.invoiceId,
        }),
      });

      const verifyRes = await res.json();
      if (verifyRes.success) {
        toast.success("Commercial payment verified successfully!");
        setShowCheckoutModal(false);
        fetchDashboard();
      } else {
        toast.error(verifyRes.message || "Verification failed");
      }
    } catch (err) {
      toast.error("Verification endpoint error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        <FiRefreshCw className="mr-2 animate-spin text-emerald-400" size={20} />
        Loading subscription engine...
      </div>
    );
  }

  const activeSub = data?.subscription;
  const planInfo = data?.plan;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
            <FiZap /> Commercial Subscription Management
          </div>
          <h1 className="text-2xl font-black text-white">Billing & Plan Status</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your HostelMate SaaS tier, renewal dates, and commercial invoices.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="px-4 py-2.5 rounded-xl bg-[#131C2E] border border-[#202B45] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 min-h-[48px] self-start sm:self-auto"
        >
          <FiRefreshCw size={14} /> Refresh Status
        </button>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202B45]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FiShield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{planInfo?.planName || "Standard Plan"}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeSub?.subscriptionStatus || "Active"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hostel ID: {activeSub?.hostelId || "Default Workspace"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400">Renewal Date</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 sm:justify-end mt-0.5">
              <FiClock size={14} className="text-emerald-400" />
              {activeSub?.subscriptionEndDate ? new Date(activeSub.subscriptionEndDate).toLocaleDateString() : "Lifetime / Active"}
            </div>
          </div>
        </div>

        {/* Quota Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400">Resident Capacity Limit</div>
            <div className="text-xl font-bold text-white">{planInfo?.maxResidents || 100} Beds</div>
          </div>
          <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400">Staff User Seats</div>
            <div className="text-xl font-bold text-white">{planInfo?.maxStaffUsers || 5} Seats</div>
          </div>
          <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400">Cloud Storage Quota</div>
            <div className="text-xl font-bold text-white">{planInfo?.maxStorageGB || 5} GB</div>
          </div>
        </div>
      </div>

      {/* Available Tier Upgrade Grid */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Available SaaS Plans & Tier Upgrades
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = p._id === planInfo?._id || p.planName === planInfo?.planName;

            return (
              <div
                key={p._id}
                className={`bg-[#131C2E] border rounded-3xl p-6 space-y-5 flex flex-col justify-between shadow-xl transition ${
                  isCurrent ? "border-2 border-emerald-500" : "border-[#202B45] hover:border-slate-600"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">{p.planName}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white">
                    ₹{(p.price || 0).toLocaleString()}
                    <span className="text-xs font-normal text-slate-400"> / year</span>
                  </div>
                  <p className="text-xs text-slate-400">{p.description || "Comprehensive hostel management plan"}</p>

                  <ul className="space-y-2 pt-2 border-t border-[#202B45] text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-400" /> Up to {p.maxResidents || 100} Resident Beds
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-400" /> {p.maxStaffUsers || 5} Staff Accounts
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-400" /> {p.maxStorageGB || 5} GB Document Storage
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleInitiatePayment(p)}
                  disabled={isCurrent || processing}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 min-h-[48px] ${
                    isCurrent
                      ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  }`}
                >
                  {isCurrent ? "Active Plan" : "Upgrade to " + p.planName}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History Table */}
      {history.length > 0 && (
        <div className="space-y-3 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Payment & Invoice History
          </h2>
          <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0B1220] border-b border-[#202B45] text-slate-400 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202B45]">
                  {history.map((h, idx) => (
                    <tr key={h._id || idx} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-mono font-bold text-white">{h.paymentId || h.orderId || "tx_sample"}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">₹{(h.amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">{new Date(h.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {h.status || "SUCCESS"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && selectedPlan && orderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-white">
            <h3 className="text-lg font-black text-white">Confirm Tier Upgrade</h3>
            <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Plan:</span>
                <strong className="text-white font-bold">{selectedPlan.planName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-slate-300">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-[#202B45]">
                <span>Total Amount:</span>
                <span>₹{(orderData.amount || selectedPlan.price).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={processing}
                className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs hover:text-white transition min-h-[48px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={processing}
                className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition min-h-[48px]"
              >
                {processing ? "Verifying..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center text-xs text-slate-500 pt-6">
        Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • Creators of HostelMate
      </div>
    </div>
  );
};

export default OwnerBillingDashboard;
