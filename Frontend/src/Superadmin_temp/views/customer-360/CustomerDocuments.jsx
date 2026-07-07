import React from "react";
import { useParams } from "react-router-dom";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";
import QuickActionButton from "../../components/widgets/QuickActionButton";
import { COLORS } from "../../constants/theme";
import { FileText, Eye, Download, Printer } from "lucide-react";

export const CustomerDocuments = React.memo(() => {
  const { id } = useParams();

  const handleAction = (doc, action) => {
    alert(`Document Operation: [${action}] on file [${doc}]`);
  };

  const headers = [
    { key: "name", label: "Document Name" },
    { key: "type", label: "File Type" },
    { key: "status", label: "Verification Status" },
    { key: "actions", label: "Actions" }
  ];

  const mockDocs = [
    { name: "Business Registration License", type: "PDF File (2.4MB)", status: "Verified" },
    { name: "Owner Aadhaar / PAN Identification Proof", type: "JPEG Image (1.8MB)", status: "Verified" },
    { name: "Tenant Police Verification Agreement", type: "PDF File (4.1MB)", status: "Pending Review" }
  ];

  return (
    <SectionCard title="Verified Compliance Documents" subtitle="Government licenses and tax registration files list">
      <SaaSTable 
        headers={headers} 
        data={mockDocs}
        renderRow={(row, idx) => (
          <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
            <td className="px-6 py-4 text-white font-semibold flex items-center gap-2">
              <FileText size={14} className="text-slate-400" />
              {row.name}
            </td>
            <td className="px-6 py-4 text-slate-300">{row.type}</td>
            <td className="px-6 py-4">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                row.status === "Verified" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              }`}>
                {row.status}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-2">
                <button onClick={() => handleAction(row.name, "preview")} className="p-1.5 rounded border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition"><Eye size={12} /></button>
                <button onClick={() => handleAction(row.name, "download")} className="p-1.5 rounded border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition"><Download size={12} /></button>
                <button onClick={() => handleAction(row.name, "print")} className="p-1.5 rounded border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition"><Printer size={12} /></button>
              </div>
            </td>
          </tr>
        )}
      />
    </SectionCard>
  );
});

export default CustomerDocuments;
