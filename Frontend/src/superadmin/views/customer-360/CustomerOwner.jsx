import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, Building, Mail, Phone, MapPin } from "lucide-react";

export default function CustomerOwner() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6 flex flex-col items-center"><AlertCircle size={32} className="mb-2" /> Failed to load owner data.</div>;
  if (!data.owner) return <div className="p-12 text-center text-slate-400 border border-white/5 rounded-xl m-6">No owner profile associated with this hostel.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl flex gap-6">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl font-bold border border-emerald-500/20 shrink-0">
          {data.owner.name ? data.owner.name.charAt(0) : "U"}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{data.owner.name}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-2 mt-1"><Building size={14}/> {data.owner.company || "Independent"}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Mail size={16} className="text-slate-500" /> {data.owner.email || "No email"}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Phone size={16} className="text-slate-500" /> {data.owner.phone || "No phone"}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300 col-span-1 md:col-span-2">
              <MapPin size={16} className="text-slate-500" /> {data.owner.address || "No address"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
