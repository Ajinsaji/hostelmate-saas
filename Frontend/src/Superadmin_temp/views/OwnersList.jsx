import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";

export const OwnersList = React.memo(() => {
  const headers = [
    { key: "name", label: "Owner Name" },
    { key: "hostel", label: "Hostel" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" }
  ];

  const mockData = [
    { name: "Rajesh Kumar", hostel: "Premium Girls Hostel", phone: "9876543210", email: "rajesh@hostelmate.com" },
    { name: "Karan Johar", hostel: "Apex Boys PG", phone: "9876543211", email: "karan@hostelmate.com" }
  ];

  return (
    <PageContainer>
      <SectionHeader title="Owners CRM" subtitle="Manage client owner profiles" />
      <ContentContainer>
        <SaaSTable headers={headers} data={mockData} />
      </ContentContainer>
    </PageContainer>
  );
});

export default OwnersList;
