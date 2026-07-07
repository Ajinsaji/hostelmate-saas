import React from "react";
import { useParams } from "react-router-dom";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";
import useAudit from "../../hooks/useAudit";
import { COLORS } from "../../constants/theme";

export const CustomerAudit = React.memo(() => {
  const { id } = useParams();
  const { data: logs } = useAudit(id);

  const headers = [
    { key: "timestamp", label: "Timestamp" },
    { key: "admin", label: "Admin Account" },
    { key: "action", label: "Action" },
    { key: "before", label: "Before State" },
    { key: "after", label: "After State" },
    { key: "ip", label: "IP/Location" }
  ];

  return (
    <SectionCard title="SaaS Security Audit Trails" subtitle="System modification history logs for this customer">
      <SaaSTable 
        headers={headers} 
        data={logs || []}
        renderRow={(row, idx) => (
          <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
            <td className="px-6 py-4 text-slate-400 font-mono">{row.timestamp}</td>
            <td className="px-6 py-4 text-white font-semibold">{row.admin}</td>
            <td className="px-6 py-4 text-slate-300 font-bold">{row.action}</td>
            <td className="px-6 py-4 text-rose-400 font-mono truncate max-w-[150px]">{row.before}</td>
            <td className="px-6 py-4 text-emerald-400 font-mono truncate max-w-[150px]">{row.after}</td>
            <td className="px-6 py-4 text-slate-400 font-mono">
              <p>{row.ip}</p>
              <p className="text-[9px] text-slate-500">{row.browser}</p>
            </td>
          </tr>
        )}
      />
    </SectionCard>
  );
});

export default CustomerAudit;
