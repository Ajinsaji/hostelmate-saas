import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, DollarSign, TrendingUp } from "lucide-react";

export default function CustomerRevenue() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load revenue data.</div>;
  
  const revenue = data.revenue || { mrr: "₹0", arr: "₹0", pending: "₹0", platformFee: "₹0" };

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4"><DollarSign size={18}/></div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Monthly Recurring</p>
        <p className="text-2xl font-black text-white">{revenue.mrr}</p>
      </div>
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4"><TrendingUp size={18}/></div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Annual Run Rate</p>
        <p className="text-2xl font-black text-white">{revenue.arr}</p>
      </div>
      <div className="bg-slate-900/50 border border-rose-500/20 p-6 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4"><AlertCircle size={18}/></div>
        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Pending Dues</p>
        <p className="text-2xl font-black text-rose-400">{revenue.pending}</p>
      </div>
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4"><DollarSign size={18}/></div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Platform Fee</p>
        <p className="text-2xl font-black text-white">{revenue.platformFee}</p>
      </div>
    </div>
  );
}
