import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";

export default function CustomerSubscription() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load subscription data.</div>;
  if (!data.subscription) return <div className="p-12 text-center text-slate-400 border border-white/5 rounded-xl m-6">No subscription details available.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><ShieldAlert size={18} className="text-emerald-400"/> Subscription Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-sm font-black text-white">{data.subscription.plan || "Pro Plan"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
            <p className="text-sm font-black text-emerald-400">{data.subscription.status || "Active"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Renewal Date</p>
            <p className="text-sm font-black text-slate-300">{data.subscription.renewalDate || "2024-12-31"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Cycle</p>
            <p className="text-sm font-black text-slate-300">{data.subscription.billingCycle || "Monthly"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
