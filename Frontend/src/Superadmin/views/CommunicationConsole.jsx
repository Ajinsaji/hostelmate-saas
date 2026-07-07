import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";

export const CommunicationConsole = React.memo(() => {
  return (
    <PageContainer>
      <SectionHeader title="Communication Desk" subtitle="Broadcast system alerts, emails and WhatsApp notifications" />
      <ContentContainer>
        <p className="text-xs text-slate-400">Template configurations, campaign planners, delivery receipts, and variables mapping tools will render here.</p>
      </ContentContainer>
    </PageContainer>
  );
});

export default CommunicationConsole;
