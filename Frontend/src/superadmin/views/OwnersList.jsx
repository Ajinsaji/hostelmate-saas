import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { Play, Pause, KeyRound } from "lucide-react";
import StatusBadge from "../components/feedback/StatusBadge";

export const OwnersList = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { key: "name", label: "Owner Name" },
    { key: "subscription", label: "Subscription" },
    { key: "daysRemaining", label: "Days Left", align: "center" },
    { key: "storage", label: "Storage", align: "center" },
    { key: "residents", label: "Residents", align: "center" },
    { key: "occupancy", label: "Occupancy", align: "center" },
    { key: "revenue", label: "MRR", align: "right" },
    { key: "actions", label: "Actions", align: "center" }
  ];

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const response = await api.get("/api/admin/owners");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching owners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  const handleAction = (action, id) => {
    toast.success(`${action} initiated for owner`);
  };

  const renderRow = (row, idx) => {
    return (
      <tr key={row.id || idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition">
        <td className="px-6 py-4">
          <p className="text-xs font-bold text-white">{row.name || row.ownerName || 'Unknown'}</p>
          <p className="text-[10px] text-slate-400">{row.email}</p>
          <p className="text-[10px] text-slate-400">{row.phone}</p>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={row.subscriptionStatus || row.status || 'active'} />
          <p className="text-[10px] text-slate-400 mt-1">{row.planName || row.plan || 'Pro Plan'}</p>
        </td>
        <td className="px-6 py-4 text-center text-xs font-medium text-amber-400">
          {row.daysRemaining ?? '—'}
        </td>
        <td className="px-6 py-4 text-center text-xs text-slate-300">
          {row.storageUsage ?? '0'} / {row.storageLimit ?? '5GB'}
        </td>
        <td className="px-6 py-4 text-center text-xs text-slate-300">
          {row.residentCount ?? row.residents ?? '0'}
        </td>
        <td className="px-6 py-4 text-center">
          <span className="text-xs font-medium text-emerald-400">{row.occupancyPercent ?? row.occupancy ?? '0'}%</span>
        </td>
        <td className="px-6 py-4 text-right text-xs font-bold text-emerald-400">
          {row.monthlyRevenue || row.revenue ? `₹${row.monthlyRevenue || row.revenue}` : '—'}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => handleAction('Suspend', row.id)} className="p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 transition" title="Suspend">
              <Pause size={14} />
            </button>
            <button onClick={() => handleAction('Activate', row.id)} className="p-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 transition" title="Activate">
              <Play size={14} />
            </button>
            <button onClick={() => handleAction('Reset Password', row.id)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 transition" title="Reset Password">
              <KeyRound size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <PageContainer>
      <SectionHeader title="Owners CRM" subtitle="Manage client owner profiles" />
      <ContentContainer>
        {loading ? <div className="p-4 text-center text-slate-400">Loading owners...</div> : <SaaSTable headers={headers} data={data} renderRow={renderRow} emptyMessage="No owners found." />}
      </ContentContainer>
    </PageContainer>
  );
});

export default OwnersList;
