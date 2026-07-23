import React, { useState, useEffect, useCallback } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { Eye, Edit2, ArrowRightLeft, LogOut, User } from "lucide-react";

export const ResidentsList = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { key: "photo", label: "Photo", align: "center" },
    { key: "name", label: "Resident Info" },
    { key: "room", label: "Room / Bed" },
    { key: "admissionDate", label: "Admission Date" },
    { key: "pendingDues", label: "Pending Dues", align: "right" },
    { key: "actions", label: "Actions", align: "center" }
  ];

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await api.get("/api/admin/residents");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching residents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResidents();
  }, []);

  const handleAction = useCallback((action, id) => {
    toast.success(`${action} initiated for resident`);
  }, []);

  const renderRow = (row, idx) => {
    return (
      <tr key={row.id || idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition">
        <td className="px-6 py-4 text-center">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto overflow-hidden">
            {row.photoUrl ? (
              <img src={row.photoUrl} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-slate-400" />
            )}
          </div>
        </td>
        <td className="px-6 py-4">
          <p className="text-xs font-bold text-white">{row.name || 'Unknown'}</p>
          <p className="text-[10px] text-slate-400">{row.phone}</p>
          <p className="text-[10px] text-slate-400">{row.hostelName}</p>
        </td>
        <td className="px-6 py-4 text-xs text-slate-300">
          <p>Room: <span className="font-bold text-white">{row.room || '—'}</span></p>
          <p>Bed: <span className="font-bold text-white">{row.bed || '—'}</span></p>
        </td>
        <td className="px-6 py-4 text-xs text-slate-300">
          {row.admissionDate || '—'}
        </td>
        <td className="px-6 py-4 text-right">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${row.pendingDues > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            ₹{row.pendingDues || '0'}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => handleAction('View', row.id)} className="p-1.5 rounded-lg border border-white/5 hover:bg-white/10 text-emerald-400 transition" title="View">
              <Eye size={14} />
            </button>
            <button onClick={() => handleAction('Edit', row.id)} className="p-1.5 rounded-lg border border-white/5 hover:bg-white/10 text-blue-400 transition" title="Edit">
              <Edit2 size={14} />
            </button>
            <button onClick={() => handleAction('Transfer', row.id)} className="p-1.5 rounded-lg border border-white/5 hover:bg-white/10 text-amber-400 transition" title="Transfer">
              <ArrowRightLeft size={14} />
            </button>
            <button onClick={() => handleAction('Checkout', row.id)} className="p-1.5 rounded-lg border border-white/5 hover:bg-white/10 text-rose-400 transition" title="Checkout">
              <LogOut size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <PageContainer>
      <SectionHeader title="Residents Roll (Read Only)" subtitle="Oversight of active tenants across the platform" />
      <ContentContainer>
        {loading ? <div className="p-4 text-center text-slate-400">Loading residents...</div> : <SaaSTable headers={headers} data={data} renderRow={renderRow} emptyMessage="No residents found." />}
      </ContentContainer>
    </PageContainer>
  );
});

export default ResidentsList;
