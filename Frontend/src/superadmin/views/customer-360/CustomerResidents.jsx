import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, User, Phone } from "lucide-react";
import StatusBadge from "../../components/feedback/StatusBadge";

export default function CustomerResidents() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load residents data.</div>;
  if (!data.residents || data.residents.length === 0) return <div className="p-12 text-center text-slate-400 border border-white/5 rounded-xl m-6">No active residents found.</div>;

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wider">
              <th className="p-4 font-bold">Resident</th>
              <th className="p-4 font-bold">Contact</th>
              <th className="p-4 font-bold">Room</th>
              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.residents.map((res, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs"><User size={12}/></div>
                    <div>
                      <p className="text-sm font-bold text-white">{res.name}</p>
                      <p className="text-[10px] text-slate-400">Joined {res.joinDate || "Recently"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-xs text-slate-300 flex items-center gap-1"><Phone size={10} /> {res.phone}</p>
                </td>
                <td className="p-4 text-xs text-slate-300 font-bold">{res.roomNumber || "Unassigned"}</td>
                <td className="p-4"><StatusBadge status={res.status || "active"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
