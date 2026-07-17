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
    { key: "subscriptionId", label: "Subscription ID" },
    { key: "hostelName", label: "Hostel" },
    { key: "ownerName", label: "Owner" },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "residents", label: "Residents" },
    { key: "expiry", label: "Expiry" },
    { key: "daysRemaining", label: "Days Left" },
    { key: "trial", label: "Trial" },
    { key: "paymentMethod", label: "Payment Method" },
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
                <td className="px-6 py-4 text-xs font-bold text-white">{row.subscriptionId}</td>
                <td className="px-6 py-4 text-xs font-bold text-white">{row.hostelName}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.ownerName || "—"}</td>
                <td className="px-6 py-4 text-xs font-bold text-emerald-400">{row.plan}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.amount ?? "—"}</td>
                <td className="px-6 py-4 text-xs">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  {typeof row.currentResidentCount === "number" && typeof row.residentLimit === "number"
                    ? `${row.currentResidentCount} / ${row.residentLimit}`
                    : "—"}
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.subscriptionEndDate ? new Date(row.subscriptionEndDate).toISOString().slice(0, 10) : row.expiry || "—"}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.daysRemaining ?? "—"}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.trial ? "Yes" : "No"}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.paymentMethod || "—"}</td>
              </tr>
            )}
          />
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default SubscriptionCenter;

