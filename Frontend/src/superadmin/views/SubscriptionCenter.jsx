import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import StatusBadge from "../components/feedback/StatusBadge";
import LoadingState from "../components/feedback/LoadingState";
import EmptyState from "../components/feedback/EmptyState";
import useSubscriptions from "../hooks/useSubscriptions";

export const SubscriptionCenter = React.memo(() => {
  const headers = [
    { key: "hostelName", label: "Hostel Name" },
    { key: "plan", label: "Plan" },
    { key: "expiry", label: "Expiry Date" },
    { key: "status", label: "Status" },
  ];

  const { data, loading, error } = useSubscriptions();

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader title="Subscription Center" subtitle="Modify plan allocations, pricing limits and free overrides" />
        <ContentContainer>
          <LoadingState message="Loading subscription center..." />
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <SectionHeader title="Subscription Center" subtitle="Modify plan allocations, pricing limits and free overrides" />
        <ContentContainer>
          <EmptyState title="Failed to load" subtitle={error} />
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader title="Subscription Center" subtitle="Modify plan allocations, pricing limits and free overrides" />
      <ContentContainer>
        {Array.isArray(data) && data.length === 0 ? (
          <EmptyState title="No subscriptions found" subtitle="Try adjusting filters or refresh the page." />
        ) : (
          <SaaSTable
            headers={headers}
            data={data}
            loading={false}
            renderRow={(row, idx) => (
              <tr key={row.subscriptionId || idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition">
                <td className="px-6 py-4 text-xs font-bold text-white">{row.hostelName}</td>
                <td className="px-6 py-4 text-xs font-bold text-emerald-400">{row.plan}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.expiry}</td>
                <td className="px-6 py-4 text-xs">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            )}
          />
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default SubscriptionCenter;

