import React from "react";
import { useParams } from "react-router-dom";
import ContentContainer from "../../layouts/ContentContainer";
import SectionHeader from "../../layouts/SectionHeader";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";
import useOwner from "../../hooks/useOwner";
import { COLORS } from "../../constants/theme";
import { User, Phone, Mail, MapPin, Laptop, Smartphone } from "lucide-react";

export const CustomerOwner = React.memo(() => {
  const { id } = useParams();
  const { data: owner } = useOwner(id);

  const deviceHeaders = [
    { key: "name", label: "Device Name" },
    { key: "os", label: "OS Version" },
    { key: "ip", label: "IP Address" },
    { key: "lastActive", label: "Last Active" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile summary */}
      <SectionCard title="Owner Profile" subtitle="Contact and authentication details">
        <div className="flex flex-col items-center text-center pb-4 border-b border-white/5 mb-4">
          <img 
            src={owner?.photo} 
            alt={owner?.name} 
            className="w-20 h-20 rounded-full object-cover border border-white/10 mb-3"
          />
          <h4 className="text-sm font-bold text-white">{owner?.name}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Last Active: {owner?.lastActive}</p>
        </div>

        <div className="space-y-3.5">
          <div className="flex gap-3 text-xs text-slate-300">
            <Phone size={14} className="shrink-0 text-slate-400" />
            <span>{owner?.phone}</span>
          </div>
          <div className="flex gap-3 text-xs text-slate-300">
            <Mail size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">{owner?.email}</span>
          </div>
          <div className="flex gap-3 text-xs text-slate-300">
            <MapPin size={14} className="shrink-0 text-slate-400" />
            <span>{owner?.address}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Emergency Contact</p>
          <p className="text-xs text-white">{owner?.emergencyContact.name} ({owner?.emergencyContact.relation})</p>
          <p className="text-xs text-slate-400 mt-1">{owner?.emergencyContact.phone}</p>
        </div>
      </SectionCard>

      {/* Platform usage & Devices */}
      <div className="lg:col-span-2 space-y-6">
        <SectionCard title="Telemetry Devices Log" subtitle="Authenticated login session browser details">
          <SaaSTable 
            headers={deviceHeaders} 
            data={owner?.devices || []}
            renderRow={(row, idx) => (
              <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
                <td className="px-6 py-4 text-white font-semibold flex items-center gap-2">
                  {row.name.includes("iPhone") ? <Smartphone size={14} /> : <Laptop size={14} />}
                  {row.name}
                </td>
                <td className="px-6 py-4 text-slate-300">{row.os}</td>
                <td className="px-6 py-4 text-slate-400 font-mono">{row.ip}</td>
                <td className="px-6 py-4 text-slate-400">{row.lastActive}</td>
              </tr>
            )}
          />
        </SectionCard>

        <SectionCard title="Platform Usage telemetry" subtitle="Activity metrics logs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Logins</p>
              <p className="text-xl font-extrabold text-white mt-1">{owner?.platformUsage.weeklyLogins} sessions</p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Session Time</p>
              <p className="text-xl font-extrabold text-white mt-1">{owner?.platformUsage.averageSession}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Core Features Active</p>
              <p className="text-xs text-white font-semibold mt-1">{owner?.platformUsage.featuresUsed.join(", ")}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
});

export default CustomerOwner;
