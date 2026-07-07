import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import StatusBadge from "../components/feedback/StatusBadge";

export const SubscriptionCenter = React.memo(() => {
  const headers = [
    { key: "hostelName", label: "Hostel Name" },
    { key: "plan", label: "Plan" },
    { key: "expiry", label: "Expiry Date" },
    { key: "status", label: "Status" }
  ];

  const mockData = [
    { hostelName: "Apex Boys PG", plan: "Pro Plan", expiry: "2026-12-31", status: "active" },
    { hostelName: "Trinity Dorms", plan: "Basic Plan", expiry: "2026-08-15", status: "trial" }
  ];

  return (
    <PageContainer>
      <SectionHeader title="Subscription Center" subtitle="Modify plan allocations, pricing limits and free overrides" />
      <ContentContainer>
        <SaaSTable 
          headers={headers} 
          data={mockData}
          renderRow={(row, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition">
              <td className="px-6 py-4 text-xs font-bold text-white">{row.hostelName}</td>
              <td className="px-6 py-4 text-xs font-bold text-emerald-400">{row.plan}</td>
              <td className="px-6 py-4 text-xs text-slate-400">{row.expiry}</td>
              <td className="px-6 py-4 text-xs">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          )}
        />
      </ContentContainer>
    </PageContainer>
  );
});

export default SubscriptionCenter;
