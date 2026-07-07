import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";

export const PlatformReports = React.memo(() => {
  return (
    <PageContainer>
      <SectionHeader title="Platform Reports" subtitle="Generate system-wide analytics, support summaries, and financial reports" />
      <ContentContainer>
        <p className="text-xs text-slate-400">PDF, Excel, and CSV download generators for subscriptions, growth metrics, and taxes will render here.</p>
      </ContentContainer>
    </PageContainer>
  );
});

export default PlatformReports;
