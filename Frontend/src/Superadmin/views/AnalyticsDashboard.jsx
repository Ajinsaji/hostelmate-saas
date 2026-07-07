import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";

export const AnalyticsDashboard = React.memo(() => {
  return (
    <PageContainer>
      <SectionHeader title="Business Intelligence Analytics" subtitle="Occupancy ratios, owner engagement metrics and alert monitoring" />
      <ContentContainer>
        <p className="text-xs text-slate-400">BI health calculations, active owner timelines, and warning score alert tables will render here.</p>
      </ContentContainer>
    </PageContainer>
  );
});

export default AnalyticsDashboard;
