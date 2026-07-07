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
        <p className="text-xs text-slate-400">Recurring revenue sparklines and historical billing collections tables will render here.</p>
      </ContentContainer>
    </PageContainer>
  );
});

export default RevenueCenter;
