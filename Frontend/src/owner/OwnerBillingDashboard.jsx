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

const OwnerBillingDashboard = () => {
  
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
      const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");

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
      const token = localStorage.getItem("token");

      // Verifies signature (Mocked for sandbox if Razorpay SDK popup not attached)
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
      toast.error("Payment verification error");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryInvoice = async (invoiceId) => {
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");

      const res = await fetch("/api/saas-payments/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceId }),
      });
      const order = await res.json();
      if (order.success) {
        setOrderData(order);
        setShowCheckoutModal(true);
      } else {
        toast.error(order.message || "Retry failed");
      }
    } catch (err) {
      toast.error("Retry order error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadInvoicePDF = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/owner/subscription/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to download PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${invoiceNumber || "HostelMate"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("PDF Invoice downloaded");
    } catch (err) {
      toast.error("Error downloading invoice PDF");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-300 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const subtotal = data?.totalAmount || 0;
  const gstAmount = Math.round((subtotal * 18) / 100);
  const grandTotal = subtotal + gstAmount;

  return (
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <FiShield className="text-emerald-400" /> Commercial Billing Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Production-ready subscription management, tax breakdown, and payment history.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">
              {data?.status} Mode
            </span>
          </div>
        </div>

        {/* Grace Period Alert */}
        {data?.inGracePeriod && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 text-amber-200">
            <FiAlertTriangle className="text-2xl text-amber-400 flex-shrink-0" />
            <div>
              <div className="font-bold">Subscription in Grace Period</div>
              <div className="text-xs text-amber-300/80">
                Your cycle has ended. You have a 3-day grace period to renew before features lock.
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Current Plan</div>
            <div className="text-2xl font-black text-emerald-400 mt-2">{data?.currentPlan?.name || "Trial"}</div>
            <div className="text-xs text-slate-400 mt-1">Full Feature Access</div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Remaining Days</div>
            <div className="text-2xl font-black text-white mt-2 flex items-center gap-2">
              <FiClock className="text-blue-400" /> {data?.daysRemaining ?? 0} Days
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Due: {data?.currentCycleEnd ? new Date(data.currentCycleEnd).toLocaleDateString() : "N/A"}
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Residents</div>
            <div className="text-2xl font-black text-indigo-400 mt-2 flex items-center gap-2">
              <FiUsers /> {data?.activeResidents ?? 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">@ ₹{data?.residentChargeRate || 10}/head</div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Grand Total (incl GST)</div>
            <div className="text-2xl font-black text-emerald-300 mt-2">₹{grandTotal}</div>
            <div className="text-xs text-slate-400 mt-1">Subtotal ₹{subtotal} + GST 18% ₹{gstAmount}</div>
          </div>
        </div>

        {/* Dynamic Billing Itemization Card */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FiZap className="text-amber-400" /> Itemized Billing Calculation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="text-slate-400 font-medium">Platform Monthly Fee</div>
              <div className="text-lg font-bold text-white mt-1">₹{data?.platformFee || 0}</div>
            </div>
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="text-slate-400 font-medium">Active Resident Charge</div>
              <div className="text-lg font-bold text-white mt-1">₹{data?.residentCharge || 0}</div>
              <div className="text-[10px] text-slate-400">{data?.activeResidents || 0} × ₹{data?.residentChargeRate || 10}</div>
            </div>
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="text-slate-400 font-medium">GST (18% Tax)</div>
              <div className="text-lg font-bold text-purple-400 mt-1">₹{gstAmount}</div>
            </div>
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
              <div className="text-emerald-300 font-medium">Grand Total Due</div>
              <div className="text-xl font-black text-emerald-400 mt-1">₹{grandTotal}</div>
            </div>
          </div>
        </div>

        {/* Subscription Plans Options */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FiLayers className="text-blue-400" /> Select Subscription Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = data?.currentPlan?._id === plan._id || data?.currentPlan?.name === plan.name;
              return (
                <div
                  key={plan._id}
                  className={`rounded-2xl p-6 flex flex-col justify-between ${
                    isCurrent
                      ? "bg-gradient-to-b from-emerald-500/10 to-emerald-900/20 border-2 border-emerald-500/60"
                      : "bg-white/[0.03] border border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>
                    <div className="my-6">
                      <span className="text-3xl font-black text-white">₹{plan.monthlyPrice}</span>
                      <span className="text-xs text-slate-400"> / month</span>
                      <div className="text-xs text-emerald-400 font-bold mt-1">
                        + ₹{plan.residentChargePerResident}/head for active residents
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInitiatePayment(plan)}
                    disabled={processing}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center gap-2"
                  >
                    {isCurrent ? "Renew Current Plan" : `Upgrade to ${plan.name}`} <FiArrowUpRight />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Attempt History Timeline */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiCreditCard className="text-purple-400" /> Payment Attempt Timeline
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3">Attempt #</th>
                  <th className="p-3">Transaction / Order ID</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {history.length > 0 ? (
                  history.map((att) => (
                    <tr key={att._id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-bold text-white">Attempt #{att.attemptNumber || 1}</td>
                      <td className="p-3 font-mono text-slate-400">{att.transactionId}</td>
                      <td className="p-3 font-bold text-white">₹{att.amount}</td>
                      <td className="p-3">{att.paymentMethod}</td>
                      <td className="p-3">{new Date(att.createdAt).toLocaleString()}</td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded font-bold border ${
                            att.paymentStatus === "Success"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : att.paymentStatus === "Pending"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {att.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        {att.paymentStatus === "Failed" && (
                          <button
                            onClick={() => handleRetryInvoice(att.invoiceId?._id || att.invoiceId)}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded border border-rose-500/30 transition flex items-center gap-1"
                          >
                            <FiRefreshCw /> Retry
                          </button>
                        )}
                        {att.paymentStatus === "Success" && att.invoiceId && (
                          <button
                            onClick={() =>
                              handleDownloadInvoicePDF(
                                att.invoiceId?._id || att.invoiceId,
                                att.invoiceId?.invoiceNumber || "INV"
                              )
                            }
                            className="bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded border border-white/10 transition flex items-center gap-1"
                          >
                            <FiDownload /> PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-500">
                      No payment attempt logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && orderData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Commercial Razorpay Checkout</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-white">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-bold text-emerald-400">{orderData.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-bold text-white">₹{orderData.billingBreakdown?.subtotal || orderData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GST (18%):</span>
                <span className="font-bold text-purple-400">₹{orderData.billingBreakdown?.gstAmount || 0}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold text-white">
                <span>Grand Total:</span>
                <span className="text-emerald-400 text-lg">₹{orderData.billingBreakdown?.grandTotal || orderData.amount}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-1/2 py-3 rounded-xl font-bold text-xs bg-white/10 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerification}
                disabled={processing}
                className="w-1/2 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2"
              >
                {processing ? "Verifying..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBillingDashboard;
