import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { RotateCcw, ShieldCheck, AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../services/api";

export const HostelsTrash = React.memo(() => {
  const [trashHostels, setTrashHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  
  // Permanent Delete modal state
  const [permanentModalHostel, setPermanentModalHostel] = useState(null);
  const [confirmNameInput, setConfirmNameInput] = useState("");
  const [isPurging, setIsPurging] = useState(false);

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

  const handlePermanentDelete = async () => {
    if (!permanentModalHostel) return;
    const expectedName = (permanentModalHostel.hostelName || permanentModalHostel.name || "").trim();
    if (confirmNameInput.trim() !== expectedName) {
      return toast.error("Hostel name does not match exact confirmation string");
    }

    setIsPurging(true);
    const toastId = toast.loading(`Purging ${expectedName} document...`);

    try {
      const res = await api.delete(`/api/admin/trash/hostels/${permanentModalHostel._id}/permanent`, {
        data: { confirmHostelName: confirmNameInput.trim() }
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Hostel document purged. Financial records remain preserved.", { id: toastId });
        setTrashHostels((prev) => prev.filter((h) => h._id !== permanentModalHostel._id));
        setPermanentModalHostel(null);
        setConfirmNameInput("");
      } else {
        toast.error(res.data?.message || "Permanent deletion failed", { id: toastId });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Permanent deletion failed", { id: toastId });
    } finally {
      setIsPurging(false);
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
                    <th className="p-4">Deleted Details</th>
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
                        <div className="text-[10px] text-slate-400 mt-0.5">By: <span className="text-white font-semibold">{hostel.deletedBy || "SuperAdmin"}</span></div>
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(hostel._id, hostel.hostelName)}
                            disabled={restoringId === hostel._id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                          >
                            {restoringId === hostel._id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <RotateCcw size={13} />
                            )}
                            <span>Restore</span>
                          </button>
                          <button
                            onClick={() => {
                              setConfirmNameInput("");
                              setPermanentModalHostel(hostel);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Purge</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ContentContainer>

      {/* Permanent Delete Modal */}
      {permanentModalHostel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Permanently Delete Hostel</h3>
                  <p className="text-xs text-rose-400 mt-0.5">Elevated Admin Authorization Required</p>
                </div>
              </div>
              <button 
                onClick={() => !isPurging && setPermanentModalHostel(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                disabled={isPurging}
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action permanently purges the hostel document for <strong className="text-white font-bold">{permanentModalHostel.hostelName}</strong>. 
              <br /><strong className="text-emerald-400">Note:</strong> Payment, subscription, and financial accounting ledgers will remain 100% preserved.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Type <span className="text-rose-400 select-all font-extrabold">{permanentModalHostel.hostelName}</span> to confirm permanent purge:
              </label>
              <input 
                type="text" 
                value={confirmNameInput}
                onChange={(e) => setConfirmNameInput(e.target.value)}
                placeholder={`Type "${permanentModalHostel.hostelName}" here`}
                disabled={isPurging}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-rose-500 transition min-h-[48px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setPermanentModalHostel(null)}
                disabled={isPurging}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-300 border border-white/10 hover:bg-white/5 transition min-h-[48px] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handlePermanentDelete}
                disabled={confirmNameInput.trim() !== (permanentModalHostel.hostelName || permanentModalHostel.name || "").trim() || isPurging}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2 min-h-[48px] cursor-pointer shadow-lg shadow-rose-900/30"
              >
                {isPurging ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Purging Document...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Permanently Purge
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
});

export default HostelsTrash;
