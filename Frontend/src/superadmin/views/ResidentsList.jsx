import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";

export const ResidentsList = React.memo(() => {
  const headers = [
    { key: "name", label: "Resident Name" },
    { key: "hostelName", label: "Hostel Name" },
    { key: "room", label: "Room" },
    { key: "phone", label: "Phone" }
  ];

  const mockData = [
    { name: "Rahul Dravid", hostelName: "Apex Boys PG", room: "101", phone: "9876543220" },
    { name: "Kareena Kapoor", hostelName: "Premium Girls Hostel", room: "204", phone: "9876543221" }
  ];

  return (
    <PageContainer>
      <SectionHeader title="Residents Roll (Read Only)" subtitle="Oversight of active tenants across the platform" />
      <ContentContainer>
        <SaaSTable headers={headers} data={mockData} />
      </ContentContainer>
    </PageContainer>
  );
});

export default ResidentsList;
