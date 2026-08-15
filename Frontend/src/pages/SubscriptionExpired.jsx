import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiRefreshCw, FiHelpCircle, FiLogOut, FiCheckCircle } from "react-icons/fi";
import api from "../utils/apiClient";
import toast from "../services/toast";

const SubscriptionExpired = () => {
  const navigate = useNavigate();

  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/owner/subscription/dashboard");
        if (res.data?.success) {
          setSubData(res.data);
        }
      } catch (err) {
        console.warn("Error fetching subscription dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleRequestContinuation = async () => {
    try {
      setSubmittingRequest(true);
      const res = await api.post("/api/owner/subscription/request-continuation", {
        requestedDays: 30,
        note: "Continuation requested from Expired screen",
      });
      if (res.data?.success) {
        toast.success("Continuation request sent to Admin successfully!");
        setSubData((prev) => ({
          ...prev,
          hasPendingRequest: true,
          pendingRequest: res.data.request,
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit continuation request");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleViewSubscription = () => {
    navigate("/owner/subscription");
  };

  const handleSupport = () => {
    navigate("/owner/settings");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("role");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const activeResidents = subData?.activeResidents || 0;
  const estimatedAmount = subData?.estimatedMonthlyAmount || activeResidents * 10;
  const expiryDateFormatted = subData?.endDate ? new Date(subData.endDate).toLocaleDateString("en-GB") : "Recently";
  const hasPendingRequest = subData?.hasPendingRequest;

  return (
    <div className="min-h-screen bg-[#081028] text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0b1739]/90 border border-rose-500/30 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
          <FiLock />
        </div>

        <div>
          <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-bold text-xs uppercase tracking-wider">
            Access Locked
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-3">TRIAL / SUBSCRIPTION EXPIRED</h1>
          <p className="text-sm text-slate-300 mt-2">
            Your HostelMate 30-day free trial or active subscription has ended. Your data remains safe and preserved.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-xs space-y-3 text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Plan:</span>
            <span className="font-bold text-emerald-400">HostelMate Unified</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Expiration Date:</span>
            <span className="font-bold text-rose-400">{expiryDateFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Current Active Residents:</span>
            <span className="font-bold text-white">{activeResidents}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2">
            <span className="text-slate-300 font-bold">Estimated Continuation Amount:</span>
            <span className="font-black text-amber-400 text-sm">₹{estimatedAmount}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {hasPendingRequest ? (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
              <FiCheckCircle size={18} /> REQUEST SENT — Waiting for Admin approval
            </div>
          ) : (
            <button
              onClick={handleRequestContinuation}
              disabled={submittingRequest}
              className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <FiRefreshCw className={submittingRequest ? "animate-spin" : ""} />
              {submittingRequest ? "Submitting..." : "Request Continuation"}
            </button>
          )}

          <button
            onClick={handleViewSubscription}
            className="w-full py-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 border border-white/10"
          >
            Manage Subscription & History
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleSupport}
              className="w-1/2 py-3 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center gap-2 border border-white/10"
            >
              <FiHelpCircle /> Support / Help
            </button>
            <button
              onClick={handleLogout}
              className="w-1/2 py-3 rounded-xl font-bold text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 flex items-center justify-center gap-2 border border-rose-500/20"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Only Subscription Management, Continuation Requests, and Logout are accessible while expired.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
