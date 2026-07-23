import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import Timeline from "../../components/widgets/Timeline";

export default function CustomerAudit() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load audit logs.</div>;
  if (!data.auditLogs || data.auditLogs.length === 0) return <div className="p-12 text-center text-slate-400 border border-white/5 rounded-xl m-6">No security or audit events recorded.</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><ShieldAlert size={18} className="text-amber-400"/> Audit Trail & Security Events</h3>
        <Timeline items={data.auditLogs} />
      </div>
    </div>
  );
}
