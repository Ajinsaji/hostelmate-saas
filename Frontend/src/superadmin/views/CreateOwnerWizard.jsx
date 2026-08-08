import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import useOwnerCreation from "../hooks/useOwnerCreation";
import CreateOwnerDesktop from "../components/wizard/CreateOwnerDesktop";
import CreateOwnerMobile from "../components/wizard/CreateOwnerMobile";

export const CreateOwnerWizard = () => {
  const ownerCreation = useOwnerCreation();

  return (
    <PageContainer>
      <div className="hidden md:block">
        <SectionHeader
          title="Manual Owner Registration"
          subtitle="Enterprise KYC, document verification, and owner onboarding request flow"
        />

        <ContentContainer className="max-w-5xl mx-auto">
          <CreateOwnerDesktop {...ownerCreation} />
        </ContentContainer>
      </div>

      <div className="block md:hidden">
        <CreateOwnerMobile {...ownerCreation} />
      </div>
    </PageContainer>
  );
};

export default CreateOwnerWizard;
