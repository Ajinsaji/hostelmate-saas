import { useState, useEffect } from "react";
import {
  FiShield,
  FiZap,
  FiClock,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "../services/toast";
import { api } from "../services/api";

const OwnerBillingDashboard = () => {
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState({ dashboard: "", plans: "", history: "" });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setData(null);
      setPlans([]);
      setHistory([]);
      setLoadErrors({ dashboard: "", plans: "", history: "" });
      const [dashRes, plansRes, histRes] = await Promise.allSettled([
        api.get("/api/owner/subscription/dashboard"),
        api.get("/api/owner/subscription/plans"),
        api.get("/api/saas-payments/history"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data?.success) {
        setData(dashRes.value.data);
      } else {
        setLoadErrors((current) => ({ ...current, dashboard: "Subscription details could not be loaded. Retry before making billing decisions." }));
      }
      if (plansRes.status === "fulfilled" && plansRes.value?.data?.success) {
        setPlans(plansRes.value.data.plans || []);
      } else {
        setLoadErrors((current) => ({ ...current, plans: "Available plans could not be loaded." }));
      }
      if (histRes.status === "fulfilled" && histRes.value?.data?.success) {
        setHistory(histRes.value.data.attempts || []);
      } else {
        setLoadErrors((current) => ({ ...current, history: "Payment history could not be loaded." }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchDashboard, 0);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
        <FiRefreshCw className="mr-2 animate-spin text-emerald-400" size={20} />
        Loading subscription engine...
      </div>
    );
  }

  const activeSub = data;
  const planInfo = data;

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
            View your current subscription and available plans. Upgrades are unavailable until secure gateway checkout is connected.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="px-4 py-2.5 rounded-xl bg-[#131C2E] border border-[#202B45] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 min-h-[48px] self-start sm:self-auto"
        >
          <FiRefreshCw size={14} /> Refresh Status
        </button>
      </div>

      {(loadErrors.dashboard || loadErrors.plans || loadErrors.history) && (
        <div role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200 space-y-2">
          {loadErrors.dashboard && <p>{loadErrors.dashboard}</p>}
          {loadErrors.plans && <p>{loadErrors.plans}</p>}
          {loadErrors.history && <p>{loadErrors.history}</p>}
        </div>
      )}

      {/* Current Subscription Card */}
      <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#202B45]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FiShield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{planInfo?.planName || "HostelMate Unified Plan"}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {activeSub?.status || "Status unavailable"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hostel ID: {activeSub?.hostelId || "Unavailable"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400">Renewal Date</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 sm:justify-end mt-0.5">
              <FiClock size={14} className="text-emerald-400" />
              {activeSub?.endDate ? new Date(activeSub.endDate).toLocaleDateString() : "Unavailable"}
            </div>
          </div>
        </div>

        {/* Quota Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400">Active Residents</div>
            <div className="text-xl font-bold text-white">{activeSub?.activeResidents ?? "Unavailable"}</div>
          </div>
          <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400">Days Remaining</div>
            <div className="text-xl font-bold text-white">{activeSub?.daysRemaining ?? "Unavailable"}</div>
          </div>
          <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-4 space-y-1">
            <div className="text-xs text-slate-400">Estimated Monthly Amount</div>
            <div className="text-xl font-bold text-white">{activeSub?.estimatedMonthlyAmount != null ? `₹${Number(activeSub.estimatedMonthlyAmount).toLocaleString("en-IN")}` : "Unavailable"}</div>
          </div>
        </div>
      </div>

      {/* Available Tier Upgrade Grid */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Available SaaS Plans & Tier Upgrades
        </h2>

        {loadErrors.plans ? (
          <p role="status" className="text-sm text-amber-200">{loadErrors.plans}</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-slate-400">No plans are currently available from the server.</p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = p.name === planInfo?.planName;

            return (
              <div
                key={p._id}
                className={`bg-[#131C2E] border rounded-3xl p-6 space-y-5 flex flex-col justify-between shadow-xl transition ${
                  isCurrent ? "border-2 border-emerald-500" : "border-[#202B45] hover:border-slate-600"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-white">
                    ₹{Number(p.monthlyPrice || 0).toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-slate-400"> / {p.durationDays || 30} days</span>
                  </div>
                  <p className="text-xs text-slate-400">{p.description || "Comprehensive hostel management plan"}</p>

                  <ul className="space-y-2 pt-2 border-t border-[#202B45] text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-400" /> ₹{Number(p.residentChargePerResident || 0).toLocaleString("en-IN")} per active resident
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-400" /> {p.features?.length || 0} configured features
                    </li>
                    <li className="flex items-center gap-2">
                      <FiCheck className="text-emerald-400" /> {p.description || "Plan details provided by server"}
                    </li>
                  </ul>
                </div>

                <button
                  disabled
                  className={`w-full py-3.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 min-h-[48px] ${
                    isCurrent
                      ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  }`}
                >
                  {isCurrent ? "Current Plan" : "Checkout unavailable"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History Table */}
      {loadErrors.history ? (
        <div role="status" className="space-y-3 pt-4 text-sm text-amber-200">{loadErrors.history}</div>
      ) : history.length > 0 ? (
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
                      <td className="px-6 py-4 font-mono font-bold text-white">{h.transactionId || h.paymentId || h.orderId || "—"}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{h.amount != null ? `₹${Number(h.amount).toLocaleString("en-IN")}` : "Unavailable"}</td>
                      <td className="px-6 py-4">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-500/20 text-slate-300 border border-slate-500/30">
                          {h.paymentStatus || h.status || "Status unavailable"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-4 text-sm text-slate-400">No subscription payment attempts are recorded.</div>
      )}

      {/* Footer Branding */}
      <div className="text-center text-xs text-slate-500 pt-6">
        Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • Creators of HostelMate
      </div>
    </div>
  );
};

export default OwnerBillingDashboard;
