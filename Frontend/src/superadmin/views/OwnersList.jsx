import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { Play, Pause, KeyRound, Mail, Phone, Building, HardDrive, IndianRupee, Users } from "lucide-react";
import StatusBadge from "../components/feedback/StatusBadge";

export const OwnersList = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOwners = async () => {
    try {
      const response = await api.get("/api/admin/owners");
      if (response.data.success) {
        setData(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching owners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleAction = async (action, id) => {
    if (!id) return;
    const toastId = toast.loading(`Executing ${action}...`);
    try {
      if (action === 'Activate') {
        await api.put(`/api/admin/owners/${id}/status`, { status: "active" });
        toast.success("Owner activated", { id: toastId });
      } else if (action === 'Suspend') {
        await api.put(`/api/admin/owners/${id}/status`, { status: "suspended" });
        toast.success("Owner suspended", { id: toastId });
      } else if (action === 'Reset Password') {
        const res = await api.post(`/api/admin/owners/${id}/reset-password`);
        if (res.data.success) {
          toast.success(`Password reset. Temp password: ${res.data.tempPassword}`, { 
            id: toastId, 
            duration: 10000 
          });
          return; // No need to re-fetch on password reset
        }
      }
      fetchOwners(); // Re-fetch to reflect status changes
    } catch (error) {
      toast.error(error?.response?.data?.message || "Action failed", { id: toastId });
    }
  };

  return (
    <PageContainer>
      <SectionHeader title="Owners CRM" subtitle="Manage client owner profiles and active subscriptions" />
      <ContentContainer>
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading owners CRM data...</div>
        ) : data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-white/5 bg-white/[0.02] rounded-2xl">
            No owners found in the system.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.map((owner) => (
              <div key={owner.id} className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition flex flex-col relative group">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/20">
                        {(owner.name || owner.ownerName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{owner.name || owner.ownerName || 'Unknown'}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{owner.company || "Independent Owner"}</p>
                      </div>
                    </div>
                    <StatusBadge status={owner.subscriptionStatus || owner.status || 'active'} />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Mail size={12} className="text-slate-500" /> {owner.email || "No email"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Phone size={12} className="text-slate-500" /> {owner.phone || "No phone"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Users size={10} /> Residents</p>
                      <p className="text-sm font-black text-white">{owner.residentCount ?? owner.residents ?? '0'}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Building size={10} /> Occupancy</p>
                      <p className="text-sm font-black text-emerald-400">{owner.occupancyPercent ?? owner.occupancy ?? '0'}%</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><HardDrive size={10} /> Storage</p>
                      <p className="text-[11px] font-bold text-slate-300 mt-1">{owner.storageUsage ?? '0'} / {owner.storageLimit ?? '5GB'}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><IndianRupee size={10} /> MRR</p>
                      <p className="text-sm font-black text-white">₹{owner.monthlyRevenue || owner.revenue || '0'}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">{owner.planName || owner.plan || 'Pro Plan'}</span>
                    <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">{owner.daysRemaining ?? '15'} Days Left</span>
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
                  <button onClick={() => handleAction('Activate', owner.id)} className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition">
                    <Play size={12} /> Activate
                  </button>
                  <button onClick={() => handleAction('Suspend', owner.id)} className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition">
                    <Pause size={12} /> Suspend
                  </button>
                  <button onClick={() => handleAction('Reset Password', owner.id)} className="flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition">
                    <KeyRound size={12} /> Reset Pwd
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default OwnersList;
