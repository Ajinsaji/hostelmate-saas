import React from "react";
import { useParams } from "react-router-dom";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";
import QuickActionButton from "../../components/widgets/QuickActionButton";
import useSupport from "../../hooks/useSupport";
import { COLORS } from "../../constants/theme";
import { ShieldAlert, HelpCircle } from "lucide-react";

export const CustomerSupport = React.memo(() => {
  const { id } = useParams();
  const { data: tickets } = useSupport(id);

  const handleSupportAction = () => {
    alert("Starting secure remote support debugging terminal console...");
  };

  const headers = [
    { key: "ticketId", label: "Ticket ID" },
    { key: "subject", label: "Subject" },
    { key: "category", label: "Category" },
    { key: "priority", label: "Priority" },
    { key: "assignedAdmin", label: "Assigned Admin" },
    { key: "status", label: "Status" }
  ];

  return (
    <div className="space-y-6">
      {/* Support action widget */}
      <div className="p-6 rounded-[26px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ background: COLORS.surfaceLight }}>
        <div className="flex items-center gap-3">
          <HelpCircle size={24} className="text-emerald-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Need to debug an operational issue?</h4>
            <p className="text-xs text-slate-400 mt-0.5">Spin up a secure warden session context for visual verification.</p>
          </div>
        </div>
        <QuickActionButton label="Start Support Session" icon={<ShieldAlert size={14} />} variant="danger" onClick={handleSupportAction} />
      </div>

      {/* Tickets queue */}
      <SectionCard title="Support Tickets Queue" subtitle="Registered tickets logged by the owner or staff">
        <SaaSTable 
          headers={headers} 
          data={tickets || []}
          renderRow={(row, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
              <td className="px-6 py-4 text-white font-mono font-semibold">{row.ticketId}</td>
              <td className="px-6 py-4 text-slate-300">{row.subject}</td>
              <td className="px-6 py-4 text-slate-400">{row.category}</td>
              <td className="px-6 py-4 text-slate-400">
                <span className={`font-bold ${row.priority === "High" ? "text-rose-400" : "text-slate-400"}`}>
                  {row.priority}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-300">{row.assignedAdmin}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  row.status === "resolved" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                }`}>
                  {row.status}
                </span>
              </td>
            </tr>
          )}
        />
      </SectionCard>
    </div>
  );
});

export default CustomerSupport;
