import React from "react";
import { useParams } from "react-router-dom";
import ContentContainer from "../../layouts/ContentContainer";
import SectionHeader from "../../layouts/SectionHeader";
import StatCard from "../../components/cards/StatCard";
import SectionCard from "../../components/cards/SectionCard";
import QuickActionButton from "../../components/widgets/QuickActionButton";
import MetricRow from "../../components/widgets/MetricRow";
import useHostel from "../../hooks/useHostel";
import useHealthScore from "../../hooks/useHealthScore";
import { COLORS } from "../../constants/theme";
import { 
  ShieldAlert, 
  Sparkles, 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckSquare, 
  Activity 
} from "lucide-react";

export const CustomerOverview = React.memo(() => {
  const { id } = useParams();
  const { data: hostel } = useHostel(id);
  const { data: health } = useHealthScore(id);

  const handleAction = (act) => {
    alert(`Action executed: [${act}] on hostel ${id}`);
  };

  return (
    <div className="space-y-6">
      {/* KPI metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Rooms" value={hostel?.rooms || "0"} trend="Active" trendDirection="neutral" />
        <StatCard title="Residents" value={hostel?.residents || "0"} trend="Occupied" trendDirection="neutral" />
        <StatCard title="Monthly Revenue" value={hostel?.revenue || "₹0"} trend="+6.2%" trendDirection="up" />
        <StatCard title="Health Rating" value={`${health?.score || 0}/100`} trend={health?.trend} trendDirection="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions panel */}
        <SectionCard title="Command Execution" subtitle="Platform actions for this customer">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            <QuickActionButton label="Impersonate Owner" icon={<ShieldAlert size={14} />} variant="danger" onClick={() => handleAction("impersonate")} />
            <QuickActionButton label="WhatsApp Notice" icon={<MessageSquare size={14} />} variant="primary" onClick={() => handleAction("whatsapp")} />
            <QuickActionButton label="Call Owner" icon={<Phone size={14} />} variant="secondary" onClick={() => handleAction("call")} />
            <QuickActionButton label="Email Owner" icon={<Mail size={14} />} variant="secondary" onClick={() => handleAction("email")} />
            <QuickActionButton label="Extend Plan 30d" icon={<CheckSquare size={14} />} variant="success" onClick={() => handleAction("extend")} />
            <QuickActionButton label="Suspend Account" icon={<ShieldAlert size={14} />} variant="danger" onClick={() => handleAction("suspend")} />
          </div>
        </SectionCard>

        {/* Health score breakdown */}
        <SectionCard title="Business Health Score" subtitle="Platform engagement analytics" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs text-slate-400">Engagement Score</span>
              <span className="text-xl font-extrabold text-emerald-400">{health?.score}/100</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(health?.breakdown) &&
                health.breakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>{item.factor}</span>
                      <span className="font-bold text-white">{item.points}/100</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${item.points}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Improvement Actions</p>
              <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                {health?.suggestions.map((s) => (
                  <li key={s.id}>{s.text}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
});

export default CustomerOverview;
