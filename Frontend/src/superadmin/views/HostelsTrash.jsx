import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { RotateCcw, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

export const HostelsTrash = React.memo(() => {
  const [trashHostels, setTrashHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/trash/hostels");
      if (res.data?.success) {
        setTrashHostels(res.data.hostels || []);
      }
    } catch {
      toast.error("Failed to load trash items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id, hostelName) => {
    if (!window.confirm(`Restore "${hostelName}" to active registry?`)) return;

    setRestoringId(id);
    const toastId = toast.loading(`Restoring ${hostelName}...`);
    try {
      const res = await api.post(`/api/admin/trash/hostels/${id}/restore`);
      if (res.data?.success) {
        toast.success(res.data.message || "Hostel restored successfully", { id: toastId });
        setTrashHostels((prev) => prev.filter((h) => h._id !== id));
      } else {
        toast.error(res.data?.message || "Failed to restore hostel", { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Restore failed", { id: toastId });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <PageContainer>
      <SectionHeader
        title="Hostels Trash"
        subtitle="Recover soft-deleted hostels. Historical & financial records are safely preserved for 60 days."
      />

      <ContentContainer>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="animate-spin" size={24} />
            <span>Loading Trash registry...</span>
          </div>
        ) : trashHostels.length === 0 ? (
          <div className="py-16 text-center border border-white/5 rounded-2xl bg-[#0B1220]/60 p-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Trash is Empty</h3>
            <p className="text-sm text-slate-400">No soft-deleted hostels. All active hostels are in the primary directory.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3 mb-6">
              <AlertTriangle size={18} className="shrink-0" />
              <span>
                <strong>60-Day Retention Policy:</strong> Deleted hostels remain recoverable in Trash for 60 days. Payments, financial accounting, and subscription ledgers are <strong>never destroyed</strong>.
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1220]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="p-4">Hostel / Owner</th>
                    <th className="p-4">Deleted Date</th>
                    <th className="p-4">Retention</th>
                    <th className="p-4">Financial Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {trashHostels.map((hostel) => (
                    <tr key={hostel._id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4">
                        <div className="font-extrabold text-white text-sm">{hostel.hostelName}</div>
                        <div className="text-slate-400 text-xs">{hostel.ownerName} • {hostel.ownerPhone}</div>
                      </td>
                      <td className="p-4">
                        <div>{hostel.deletedAt ? new Date(hostel.deletedAt).toLocaleDateString() : "Recently"}</div>
                        <div className="text-[10px] text-slate-500">Reason: {hostel.deleteReason}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          hostel.daysRemaining <= 10
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}>
                          {hostel.daysRemaining} days remaining (Retained 60 days)
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <ShieldCheck size={14} />
                          <span>Preserved ({hostel.paymentCount || 0} payments)</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Plan: {hostel.planType}</div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRestore(hostel._id, hostel.hostelName)}
                          disabled={restoringId === hostel._id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          {restoringId === hostel._id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RotateCcw size={13} />
                          )}
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default HostelsTrash;
