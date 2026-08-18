import React from "react";
import PageContainer from "../superadmin/layouts/PageContainer";
import SectionHeader from "../superadmin/layouts/SectionHeader";
import ContentContainer from "../superadmin/layouts/ContentContainer";
import useOwnerCreation from "../superadmin/hooks/useOwnerCreation";
import CreateOwnerDesktop from "../superadmin/components/wizard/CreateOwnerDesktop";
import CreateOwnerMobile from "../superadmin/components/wizard/CreateOwnerMobile";

export const SharedRegistrationWizard = ({ mode = "public", showPageHeader = true }) => {
  const ownerCreation = useOwnerCreation(mode);

  return (
    <div className="w-full min-h-screen bg-[#0B1220] text-white">
      <PageContainer>
        {/* Desktop View */}
        <div className="hidden md:block">
          {showPageHeader && (
            <SectionHeader
              title={mode === "public" ? "HostelMate Owner Registration" : "Manual Owner Registration"}
              subtitle={
                mode === "public"
                  ? "Submit your hostel registration application for review & activation"
                  : "Enterprise KYC, document verification, and owner onboarding request flow"
              }
            />
          )}

          <ContentContainer className="max-w-5xl mx-auto">
            <CreateOwnerDesktop {...ownerCreation} />
          </ContentContainer>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden">
          <CreateOwnerMobile {...ownerCreation} />
        </div>
      </PageContainer>
    </div>
  );
};

export default SharedRegistrationWizard;
