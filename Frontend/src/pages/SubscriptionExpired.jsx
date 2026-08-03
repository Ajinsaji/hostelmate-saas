import { useTheme } from "../design-system/ThemeProvider";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiAlertTriangle, FiRefreshCw, FiHelpCircle, FiLogOut } from "react-icons/fi";
import toast from "../services/toast";

const SubscriptionExpired = () => {
  
  const navigate = useNavigate();

  const state = useMemo(() => {
    try {
      return window?.history?.state || {};
    } catch {
      return {};
    }
  }, []);

  const [hostelName, setHostelName] = useState(state?.hostelName || "Your Hostel");
  const [planType, setPlanType] = useState(state?.planType || "Pro / Base");
  const [expiryDate, setExpiryDate] = useState(state?.expiryDate || "Expired");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/owner/subscription/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.currentPlan?.name) setPlanType(data.currentPlan.name);
          if (data?.nextBillingDate || data?.trialEndDate) {
            setExpiryDate(new Date(data.nextBillingDate || data.trialEndDate).toLocaleDateString());
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleRenew = () => {
    navigate("/owner/subscription");
  };

  const handleSupport = () => {
    navigate("/owner/support");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#081028] text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0b1739]/80 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
          <FiLock />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white">Subscription Expired</h1>
          <p className="text-sm text-slate-400 mt-2">
            Your HostelMate SaaS subscription has expired. System operations are temporarily locked.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-xs space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-400">Hostel Name:</span>
            <span className="font-bold text-white">{hostelName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Previous Plan:</span>
            <span className="font-bold text-emerald-400">{planType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Expiration Date:</span>
            <span className="font-bold text-rose-400">{expiryDate}</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleRenew}
            className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <FiRefreshCw /> Renew Subscription & Pay Now
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleSupport}
              className="w-1/2 py-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center gap-2"
            >
              <FiHelpCircle /> Support Desk
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
          Only Subscription Management, Support Desk, and Logout are accessible while expired.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
