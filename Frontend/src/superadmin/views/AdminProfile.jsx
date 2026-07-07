import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";

export const AdminProfile = React.memo(() => {
  return (
    <PageContainer>
      <SectionHeader title="Superadmin Profile" subtitle="Manage credentials and settings for this administrator account" />
      <ContentContainer>
        <p className="text-xs text-slate-400">FullName, email address, password change, and security tokens logs will render here.</p>
      </ContentContainer>
    </PageContainer>
  );
});

export default AdminProfile;
