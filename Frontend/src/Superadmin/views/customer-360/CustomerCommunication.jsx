import React from "react";
import { useParams } from "react-router-dom";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";
import QuickActionButton from "../../components/widgets/QuickActionButton";
import useCommunication from "../../hooks/useCommunication";
import { COLORS } from "../../constants/theme";
import { MessageSquare, Mail, Bell } from "lucide-react";

export const CustomerCommunication = React.memo(() => {
  const { id } = useParams();
  const { data: comms } = useCommunication(id);

  const handleSend = (type) => {
    alert(`Triggering instant notification broadcast: [${type}] to hostel ${id}`);
  };

  const headers = [
    { key: "channel", label: "Channel" },
    { key: "recipient", label: "Recipient" },
    { key: "template", label: "Template" },
    { key: "sentAt", label: "Sent At" },
    { key: "status", label: "Delivery Status" }
  ];

  return (
    <div className="space-y-6">
      {/* Broadcast tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SectionCard title="Notification Dispatcher" subtitle="Trigger alerts directly to the owner" className="md:col-span-2">
          <div className="flex flex-wrap gap-3">
            <QuickActionButton label="Send WhatsApp" icon={<MessageSquare size={14} />} variant="primary" onClick={() => handleSend("whatsapp")} />
            <QuickActionButton label="Send Email" icon={<Mail size={14} />} variant="secondary" onClick={() => handleSend("email")} />
            <QuickActionButton label="Push Alert" icon={<Bell size={14} />} variant="secondary" onClick={() => handleSend("push")} />
          </div>
        </SectionCard>
        
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FCM Message Delivery Rate</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">98.2%</p>
        </div>
      </div>

      {/* Communications list */}
      <SectionCard title="Communications Log Ledger" subtitle="Dispatched WhatsApp, push alerts and templates history">
        <SaaSTable 
          headers={headers} 
          data={comms || []}
          renderRow={(row, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
              <td className="px-6 py-4 text-white font-semibold flex items-center gap-2">
                {row.channel === "WhatsApp" ? <MessageSquare size={14} /> : row.channel === "Email" ? <Mail size={14} /> : <Bell size={14} />}
                {row.channel}
              </td>
              <td className="px-6 py-4 text-slate-300">{row.recipient}</td>
              <td className="px-6 py-4 text-slate-400">{row.template}</td>
              <td className="px-6 py-4 text-slate-400">{row.sentAt}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  row.status === "delivered" 
                    ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
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

export default CustomerCommunication;
