import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, CreditCard, Calendar } from "lucide-react";
import StatusBadge from "../../components/feedback/StatusBadge";

export default function CustomerPayments() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load payments data.</div>;
  if (!data.payments || data.payments.length === 0) return <div className="p-12 text-center text-slate-400 border border-white/5 rounded-xl m-6">No payment history available.</div>;

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
              <th className="p-4 font-bold">Transaction ID</th>
              <th className="p-4 font-bold">Date</th>
              <th className="p-4 font-bold">Amount</th>
              <th className="p-4 font-bold">Method</th>
              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((pay, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-4 text-xs font-mono text-emerald-400">{pay.transactionId || pay.id}</td>
                <td className="p-4 text-xs text-slate-300 flex items-center gap-1"><Calendar size={12}/> {pay.date}</td>
                <td className="p-4 text-sm font-bold text-white">₹{pay.amount}</td>
                <td className="p-4 text-xs text-slate-400 flex items-center gap-1"><CreditCard size={12} /> {pay.method || "Online"}</td>
                <td className="p-4"><StatusBadge status={pay.status || "success"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
