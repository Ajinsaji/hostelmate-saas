import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, HardDrive } from "lucide-react";

export default function CustomerStorage() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load storage data.</div>;
  
  const usage = data.storage?.usage || 0;
  const limit = data.storage?.limit || 10;
  const percent = Math.min((usage / limit) * 100, 100).toFixed(0);

  return (
    <div className="p-6 max-w-2xl">
      <div className="bg-slate-900/50 border border-white/5 p-8 rounded-2xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-8"><HardDrive size={18} className="text-blue-400"/> Storage Allocation</h3>
        <div className="flex justify-between items-end mb-2">
          <p className="text-sm font-bold text-slate-300">Used Capacity</p>
          <p className="text-lg font-black text-white">{usage}GB / {limit}GB</p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden border border-white/5">
          <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
        </div>
        <p className="text-xs text-slate-400 text-right">{percent}% Utilized</p>
      </div>
    </div>
  );
}
