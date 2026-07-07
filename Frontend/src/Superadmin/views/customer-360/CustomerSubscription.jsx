import React from "react";
import { useParams } from "react-router-dom";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";
import QuickActionButton from "../../components/widgets/QuickActionButton";
import useSubscription from "../../hooks/useSubscription";
import { COLORS } from "../../constants/theme";
import { CreditCard, ShieldAlert, Award, ArrowUpRight } from "lucide-react";

export const CustomerSubscription = React.memo(() => {
  const { id } = useParams();
  const { data: sub } = useSubscription(id);

  const handleAction = (act) => {
    alert(`Subscription operation: [${act}] on hostel ${id}`);
  };

  const headers = [
    { key: "action", label: "Action" },
    { key: "plan", label: "Plan" },
    { key: "price", label: "Rate" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active plan summary */}
        <SectionCard title="Active Pricing Plan" subtitle="SaaS Plan parameters">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ borderColor: "rgba(16, 185, 129, 0.2)", background: "rgba(16, 185, 129, 0.05)" }}
            >
              <Award size={20} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">{sub?.planName || "Pro Plan"}</h4>
              <p className="text-[10px] text-slate-400">Renewal due: {sub?.renewalDate}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Beds Quota:</span>
              <span className="font-bold text-white">{sub?.residentLimit}</span>
            </div>
            <div className="flex justify-between">
              <span>Beds Occupied:</span>
              <span className="font-bold text-white">{sub?.currentResidents}</span>
            </div>
          </div>
        </SectionCard>

        {/* Actions panel */}
        <SectionCard title="Subscription Actions" subtitle="Override system variables">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <QuickActionButton label="Upgrade Plan" icon={<ArrowUpRight size={14} />} variant="primary" onClick={() => handleAction("upgrade")} />
            <QuickActionButton label="Pause Account" icon={<ShieldAlert size={14} />} variant="warning" onClick={() => handleAction("pause")} />
            <QuickActionButton label="Force Expire" icon={<ShieldAlert size={14} />} variant="danger" onClick={() => handleAction("expire")} />
            <QuickActionButton label="Renew Manually" icon={<CreditCard size={14} />} variant="success" onClick={() => handleAction("renew")} />
          </div>
        </SectionCard>

        {/* Upgrade suggestions */}
        <SectionCard title="Growth Suggestions" subtitle="AI revenue opportunities">
          <div className="p-3.5 rounded-xl border border-yellow-500/10 bg-yellow-500/[0.02]">
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider mb-2">Upgrade Recommendation</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              This hostel has reached 85% occupancy capacity. Suggest shifting to Enterprise Custom Plan to support warden access limits.
            </p>
          </div>
        </SectionCard>
      </div>

      {/* History table */}
      <SectionCard title="Payment and Billing Logs" subtitle="Historical transaction registry">
        <SaaSTable 
          headers={headers} 
          data={sub?.history || []}
          renderRow={(row, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
              <td className="px-6 py-4 text-white font-semibold">{row.action}</td>
              <td className="px-6 py-4 text-slate-300">{row.plan}</td>
              <td className="px-6 py-4 text-slate-400 font-bold">{row.price}</td>
              <td className="px-6 py-4 text-slate-400">{row.date}</td>
              <td className="px-6 py-4">
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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

export default CustomerSubscription;
