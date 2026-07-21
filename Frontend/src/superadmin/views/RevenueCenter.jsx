import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import StatCard from "../components/cards/StatCard";

export const RevenueCenter = React.memo(() => {
  return (
    <PageContainer>
      <SectionHeader title="Revenue Center" subtitle="Track platform sales, invoices and outstanding accounts" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Today's Revenue" value="₹12,400" trend="Stable" trendDirection="neutral" className="p-5" />
        <StatCard title="Collections (Current Month)" value="₹2,48,500" trend="+14%" trendDirection="up" className="p-5" />
        <StatCard title="Pending Outstanding" value="₹24,000" trend="Action Required" trendDirection="down" className="p-5" />
      </div>
      <ContentContainer>
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-xl bg-slate-900/50">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-slate-200 mb-2">No billing data available yet</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Billing history and revenue trends will appear after subscriptions or transactions are recorded.
          </p>
        </div>
      </ContentContainer>
    </PageContainer>
  );
});

export default RevenueCenter;
