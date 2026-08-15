import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Zap,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  HelpCircle,
  Calendar,
  IndianRupee,
  RefreshCw,
  FileText,
  AlertTriangle,
} from "lucide-react";
import toast from "../services/toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function SubscriptionBilling() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDays, setRequestDays] = useState(30);
  const [ownerNote, setOwnerNote] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const fetchSubscriptionDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/owner/subscription/dashboard");
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptionDetails();
  }, [fetchSubscriptionDetails]);

  const handleSendContinuationRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmittingRequest(true);
      const res = await api.post("/api/owner/subscription/request-continuation", {
        requestedDays: Number(requestDays) || 30,
        note: ownerNote,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Continuation request submitted successfully!");
        setShowRequestModal(false);
        setOwnerNote("");
        fetchSubscriptionDetails();
      } else {
        toast.error(res.data?.message || "Failed to submit continuation request");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Error submitting continuation request";
      toast.error(msg);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const status = (data?.status || "trial").toLowerCase();
  const isTrial = data?.isTrial || status === "trial";
  const isExpired = data?.isExpired || status === "expired" || (data?.daysRemaining !== undefined && data.daysRemaining < 0);
  const daysLeft = typeof data?.daysRemaining === "number" ? Math.max(0, data.daysRemaining) : 0;
  const activeResidents = data?.activeResidents || 0;
  const monthlyRate = data?.monthlyRate || 10;
  const estimatedMonthly = activeResidents * monthlyRate;
  const pendingRequest = data?.pendingRequest;

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Zap className="text-amber-400" /> Subscription & Licensing
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              HostelMate Unified Owner Plan — 30-Day Free Trial & Prorated Resident Billing
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isExpired ? (
              <StatusPill tone="danger">Subscription Expired</StatusPill>
            ) : isTrial ? (
              <StatusPill tone="warning">Free Trial Active</StatusPill>
            ) : (
              <StatusPill tone="success">Active Subscription</StatusPill>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading subscription & billing details...
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            {/* Primary Subscription Status Card */}
            <Card className="bg-[#162032] border-[#22304A] p-6 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                      {isTrial ? "30-Day Free Trial" : "Unified Owner License"}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white mt-1">
                    {isExpired
                      ? "Trial / Subscription Expired"
                      : isTrial
                      ? `Free Trial — ${daysLeft} Days Left`
                      : `Active License — ${daysLeft} Days Remaining`}
                  </h2>
                  <p className="text-sm text-slate-400 mt-2">
                    {isExpired
                      ? `Your subscription ended on ${data.endDate ? new Date(data.endDate).toLocaleDateString("en-GB") : "recently"}. Request continuation to keep full access.`
                      : isTrial
                      ? `Your 30-day free trial ends on ${data.endDate ? new Date(data.endDate).toLocaleDateString("en-GB") : "N/A"}. No credit card required.`
                      : `License valid through ${data.endDate ? new Date(data.endDate).toLocaleDateString("en-GB") : "N/A"}.`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => setShowRequestModal(true)}
                    disabled={data.hasPendingRequest}
                    className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                      data.hasPendingRequest
                        ? "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20"
                    }`}
                  >
                    <Send size={16} />
                    {data.hasPendingRequest ? "Continuation Request Pending" : "Request Subscription Continuation"}
                  </button>
                  <a
                    href="mailto:support@hostelmate.com"
                    className="px-5 py-3.5 rounded-2xl font-bold text-sm bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center gap-2"
                  >
                    <HelpCircle size={16} /> Contact Admin
                  </a>
                </div>
              </div>

              {/* Countdown & Metrics Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#22304A]">
                <div className="p-4 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Active Residents</span>
                  <span className="text-xl font-black text-emerald-400 mt-1 block">
                    {activeResidents}
                  </span>
                  <span className="text-[11px] text-slate-500">Currently enrolled</span>
                </div>

                <div className="p-4 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Base Pricing Rate</span>
                  <span className="text-xl font-black text-white mt-1 block">
                    ₹{monthlyRate}
                  </span>
                  <span className="text-[11px] text-slate-500">per resident / month</span>
                </div>

                <div className="p-4 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Estimated Monthly Amount</span>
                  <span className="text-xl font-black text-amber-400 mt-1 block">
                    ₹{estimatedMonthly}
                  </span>
                  <span className="text-[11px] text-slate-500">{activeResidents} × ₹{monthlyRate}</span>
                </div>

                <div className="p-4 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Payment Status</span>
                  <span className="text-xl font-black text-teal-400 mt-1 block">
                    {data.paymentStatus || "Pending"}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Paid: ₹{data.paidAmount || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Pending Request Banner */}
            {pendingRequest && (
              <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-start gap-4 text-amber-200">
                <Clock className="w-6 h-6 flex-shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-amber-100 text-base">Continuation Request Pending Admin Review</div>
                  <p className="mt-1 text-amber-200/90 text-xs">
                    You requested <b>{pendingRequest.requestedDays} days</b> extension on{" "}
                    {new Date(pendingRequest.requestedAt || pendingRequest.createdAt).toLocaleDateString("en-GB")}.
                    Estimated amount: <b>₹{pendingRequest.calculatedAmount}</b> ({pendingRequest.residentCount} active residents).
                  </p>
                  {pendingRequest.ownerNote && (
                    <div className="mt-2 text-xs italic bg-black/20 p-2.5 rounded-xl border border-amber-500/20">
                      Your note: "{pendingRequest.ownerNote}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejected Request Alert */}
            {!pendingRequest && data.latestRequest?.status === "rejected" && (
              <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-start gap-4 text-rose-200">
                <AlertCircle className="w-6 h-6 flex-shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-bold text-rose-100 text-base">Previous Continuation Request Rejected</div>
                  <p className="mt-1 text-rose-200/90 text-xs">
                    Admin reason: "{data.latestRequest.adminNote || "Please contact admin"}"
                  </p>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="mt-3 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold rounded-xl text-xs border border-rose-500/30"
                  >
                    Submit New Request
                  </button>
                </div>
              </div>
            )}

            {/* Prorated Billing Breakdown */}
            {data.billingBreakdown && (
              <Card className="bg-[#162032] border-[#22304A]">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <IndianRupee className="text-emerald-400" size={18} /> Prorated Resident Billing Breakdown
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Accurate line-item calculation based on active billable days (₹10 / 30 days = ₹0.33/day).
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-300 bg-[#0B1120] px-3 py-1.5 rounded-xl border border-[#22304A]">
                    Total: ₹{data.billingBreakdown.totalAmount}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0B1120] text-slate-400 uppercase font-bold border-b border-[#22304A]">
                      <tr>
                        <th className="p-3">Resident Name</th>
                        <th className="p-3">Room</th>
                        <th className="p-3">Admission Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Billable Days</th>
                        <th className="p-3 text-right">Calculated Charge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22304A]/60 text-slate-300">
                      {data.billingBreakdown.lineItems?.slice(0, 15).map((item, idx) => (
                        <tr key={item.residentId || idx} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white">{item.name}</td>
                          <td className="p-3 text-slate-400">{item.roomNo}</td>
                          <td className="p-3 text-slate-400">
                            {item.admissionDate ? new Date(item.admissionDate).toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{item.activeDays} / {item.billingDays} days</td>
                          <td className="p-3 text-right font-black text-emerald-400">₹{item.charge.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Subscription History Audit Log */}
            <Card className="bg-[#162032] border-[#22304A]">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-blue-400" /> Subscription & Extension History
              </h3>
              {data.history?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No history records found.</p>
              ) : (
                <div className="space-y-3">
                  {data.history?.map((hist, idx) => (
                    <div
                      key={hist._id || idx}
                      className="p-3.5 bg-[#0B1120] border border-[#22304A] rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{hist.action.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-slate-400">by {hist.changedBy || "System"}</span>
                        </div>
                        {hist.reason && <p className="text-[11px] text-slate-400 mt-0.5">{hist.reason}</p>}
                      </div>
                      <div className="text-right text-slate-400 text-[11px]">
                        {new Date(hist.createdAt).toLocaleString("en-GB")}
                        {hist.newEndDate && (
                          <div className="text-emerald-400 font-semibold text-[10px]">
                            New Expiry: {new Date(hist.newEndDate).toLocaleDateString("en-GB")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        ) : null}

        {/* Modal: CONTINUE HOSTELMATE / Request Continuation */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b1739] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">HostelMate Continuation</span>
                <h3 className="text-2xl font-black text-white mt-1">Continue HostelMate</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Submit a subscription continuation request to your platform administrator.
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Current Subscription Status:</span>
                  <span className="font-bold text-white capitalize">{status}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Active Residents:</span>
                  <span className="font-bold text-emerald-400">{activeResidents}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Monthly Rate:</span>
                  <span className="font-bold text-white">₹10 / resident</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-white/10 pt-2">
                  <span className="font-bold text-white">Suggested Monthly Amount:</span>
                  <span className="font-black text-amber-400 text-sm">₹{estimatedMonthly}</span>
                </div>
              </div>

              <form onSubmit={handleSendContinuationRequest} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Requested Duration</label>
                  <select
                    value={requestDays}
                    onChange={(e) => setRequestDays(Number(e.target.value))}
                    className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value={30}>30 Days (Standard 1 Month)</option>
                    <option value={60}>60 Days (2 Months)</option>
                    <option value={90}>90 Days (3 Months)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Message / Note (Optional)</label>
                  <textarea
                    rows={3}
                    value={ownerNote}
                    onChange={(e) => setOwnerNote(e.target.value)}
                    placeholder="e.g. Paid ₹300 via UPI, transaction ID: 9812..."
                    className="w-full bg-[#0B1120] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="w-1/2 py-3 rounded-xl font-bold bg-white/10 text-slate-300 hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="w-1/2 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition"
                  >
                    {submittingRequest ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
