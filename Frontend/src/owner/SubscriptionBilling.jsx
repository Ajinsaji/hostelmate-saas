import React, { useState, useEffect } from "react";
import {
  FiShield,
  FiZap,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiArrowUpRight,
  FiCreditCard,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import toast from "../services/toast";

const SubscriptionBilling = () => {
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upgradeCalc, setUpgradeCalc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/owner/subscription/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        toast.error(result.message || "Failed to fetch subscription status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading subscription details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/owner/subscription/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setPlans(result.plans);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchPlans();
  }, []);

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/owner/subscription/calculate-upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: plan._id }),
      });
      const result = await res.json();
      if (result.success) {
        setUpgradeCalc(result.calculation);
        setShowModal(true);
      } else {
        toast.error(result.message || "Calculation failed");
      }
    } catch (err) {
      toast.error("Failed to calculate upgrade balance");
    }
  };

  const handlePay = async () => {
    if (!selectedPlan) return;
    try {
      setProcessing(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/owner/subscription/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan._id,
          paymentMethod: "Razorpay",
          transactionId: `TXN-${Date.now()}`,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Subscription upgraded & paid successfully!");
        setShowModal(false);
        fetchDashboard();
      } else {
        toast.error(result.message || "Payment failed");
      }
    } catch (err) {
      toast.error("Payment transaction error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-300 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const getStatusBadge = (status, inGrace) => {
    if (inGrace) {
      return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold">⚠️ Grace Period</span>;
    }
    switch (status) {
      case "Trial":
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-bold">✨ Trial Mode</span>;
      case "Active":
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">✓ Active Subscription</span>;
      case "Expired":
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-3 py-1 rounded-full font-bold">🔒 Expired</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs px-3 py-1 rounded-full font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <FiShield className="text-emerald-400" /> Subscription & Billing
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your hostel's plan, dynamic resident charges, and view billing history.
            </p>
          </div>
          <div>{data && getStatusBadge(data.status, data.inGracePeriod)}</div>
        </div>

        {/* Banner Alert for Grace Period / Expiry */}
        {data?.inGracePeriod && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 text-amber-200">
            <FiAlertCircle className="text-2xl text-amber-400 flex-shrink-0" />
            <div>
              <div className="font-bold">Subscription in Grace Period</div>
              <div className="text-xs text-amber-300/80">
                Your subscription has ended. You have a 3-day grace period to renew before features lock.
              </div>
            </div>
          </div>
        )}

        {/* Current Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Current Plan</div>
            <div className="text-2xl font-black text-emerald-400 mt-2">{data?.currentPlan?.name || "Trial"}</div>
            <div className="text-xs text-slate-400 mt-2">Full Access Mode</div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Days Remaining</div>
            <div className="text-2xl font-black text-white mt-2 flex items-center gap-2">
              <FiClock className="text-blue-400 text-xl" /> {data?.daysRemaining ?? 0} Days
            </div>
            <div className="text-xs text-slate-400 mt-2">Cycle Ends: {data?.currentCycleEnd ? new Date(data.currentCycleEnd).toLocaleDateString() : "N/A"}</div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Residents</div>
            <div className="text-2xl font-black text-indigo-400 mt-2 flex items-center gap-2">
              <FiUsers className="text-xl" /> {data?.activeResidents ?? 0}
            </div>
            <div className="text-xs text-slate-400 mt-2">Only Active Residents Billed</div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estimated Monthly Total</div>
            <div className="text-2xl font-black text-emerald-300 mt-2">₹{data?.totalAmount ?? 0}</div>
            <div className="text-xs text-slate-400 mt-2">Platform ₹{data?.platformFee} + Residents ₹{data?.residentCharge}</div>
          </div>
        </div>

        {/* Dynamic Calculation Breakdown */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FiZap className="text-amber-400" /> Current Billing Calculation Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="text-slate-400 font-medium">Platform Base Plan Fee</div>
              <div className="text-xl font-bold text-white mt-1">₹{data?.platformFee || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Fixed monthly subscription</div>
            </div>
            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="text-slate-400 font-medium">Active Resident Charge</div>
              <div className="text-xl font-bold text-white mt-1">₹{data?.residentCharge || 0}</div>
              <div className="text-xs text-slate-400 mt-1">
                {data?.activeResidents || 0} Residents × ₹{data?.residentChargeRate || 10} / head
              </div>
            </div>
            <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="text-emerald-300 font-medium">Total Monthly Billing</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">₹{data?.totalAmount || 0}</div>
              </div>
              <button
                onClick={() => {
                  const pro = plans.find((p) => p.name === "Pro") || plans[0];
                  if (pro) handleSelectPlan(pro);
                }}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-xs"
              >
                Renew / Upgrade Plan <FiArrowUpRight />
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Plans Selection */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <FiLayers className="text-blue-400" /> Available Plans & Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = data?.currentPlan?._id === plan._id || data?.currentPlan?.name === plan.name;
              return (
                <div
                  key={plan._id}
                  className={`relative rounded-2xl p-6 transition flex flex-col justify-between ${
                    isCurrent
                      ? "bg-gradient-to-b from-emerald-500/10 to-emerald-900/20 border-2 border-emerald-500/60"
                      : "bg-white/[0.03] border border-white/10 hover:border-white/20"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  )}
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
                    <div className="space-y-2 mb-6">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Features Included:</div>
                      {plan.features?.map((feat) => (
                        <div key={feat._id || feat.code} className="text-xs text-slate-300 flex items-center gap-2">
                          <FiCheck className="text-emerald-400 flex-shrink-0" />
                          <span>{feat.name || feat.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition ${
                      isCurrent
                        ? "bg-white/10 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950"
                    }`}
                  >
                    {isCurrent ? "Active Plan" : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoices & Billing History */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiFileText className="text-indigo-400" /> Billing History & Invoices
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3">Invoice No</th>
                  <th className="p-3">Billing Date</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Active Residents</th>
                  <th className="p-3">Plan Price</th>
                  <th className="p-3">Resident Charge</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {data?.invoices?.length > 0 ? (
                  data.invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                      <td className="p-3">{new Date(inv.billingDate).toLocaleDateString()}</td>
                      <td className="p-3 font-bold text-emerald-400">{inv.planName}</td>
                      <td className="p-3">{inv.activeResidents}</td>
                      <td className="p-3">₹{inv.planPrice}</td>
                      <td className="p-3">₹{inv.residentCharge}</td>
                      <td className="p-3 font-bold text-white">₹{inv.totalAmount}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-slate-500">
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Upgrade / Renewal Modal */}
      {showModal && upgradeCalc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Confirm Upgrade & Payment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Plan:</span>
                <span className="font-bold text-white">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">New Plan Monthly Price:</span>
                <span className="font-bold text-white">₹{upgradeCalc.newPlatformAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Less Trial / Credit Balance:</span>
                <span className="font-bold text-emerald-400">- ₹{upgradeCalc.paidAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Platform Price:</span>
                <span className="font-bold text-white">₹{upgradeCalc.priceDifference}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-slate-400">Active Residents Charge:</span>
                <span className="font-bold text-white">
                  {upgradeCalc.activeResidents} × ₹{upgradeCalc.residentChargeRate} = ₹{upgradeCalc.residentCharge}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-sm font-bold text-white">
                <span>Total Amount Due Now:</span>
                <span className="text-emerald-400 text-lg">₹{upgradeCalc.totalDue}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="w-1/2 py-3 rounded-xl font-bold text-xs bg-white/10 text-slate-300 hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={processing}
                className="w-1/2 py-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2"
              >
                {processing ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionBilling;
