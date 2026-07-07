import React from "react";
import { useParams } from "react-router-dom";
import ContentContainer from "../../layouts/ContentContainer";
import SectionHeader from "../../layouts/SectionHeader";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";
import Timeline from "../../components/widgets/Timeline";
import useFinancials from "../../hooks/useFinancials";
import { COLORS } from "../../constants/theme";

export const CustomerFinancials = React.memo(() => {
  const { id } = useParams();
  const { data: financials } = useFinancials(id);

  const invoiceHeaders = [
    { key: "invoiceId", label: "Invoice ID" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "plan", label: "Plan Type" },
    { key: "status", label: "Status" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Collections</p>
          <p className="text-xl font-extrabold text-white mt-1">{financials?.monthlyCollections || "₹0"}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Rent</p>
          <p className="text-xl font-extrabold text-white mt-1" style={{ color: COLORS.warning }}>{financials?.pendingRent || "₹0"}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expenses Ledger</p>
          <p className="text-xl font-extrabold text-white mt-1">{financials?.expenses || "₹0"}</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Hostel Profit</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">{financials?.profit || "₹0"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="SaaS Invoices history" subtitle="Historical subscription payments logged">
            <SaaSTable 
              headers={invoiceHeaders} 
              data={financials?.invoices || []}
              renderRow={(row, idx) => (
                <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
                  <td className="px-6 py-4 text-white font-mono font-semibold">{row.invoiceId}</td>
                  <td className="px-6 py-4 text-slate-300">{row.date}</td>
                  <td className="px-6 py-4 text-slate-400 font-bold">{row.amount}</td>
                  <td className="px-6 py-4 text-slate-400">{row.plan}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                      {row.status}
                    </span>
                  </td>
                </tr>
              )}
            />
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Payment Timeline" subtitle="Recent financial logs">
            <Timeline items={financials?.paymentTimeline} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
});

export default CustomerFinancials;
