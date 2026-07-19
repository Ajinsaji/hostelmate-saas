import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import { api } from "../../services/api";
import toast from "react-hot-toast";

export const ResidentsList = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { key: "name", label: "Resident Name" },
    { key: "hostelName", label: "Hostel Name" },
    { key: "room", label: "Room" },
    { key: "phone", label: "Phone" }
  ];

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await api.get("/api/admin/residents");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching residents:", error);
        toast.error("Failed to fetch residents list");
      } finally {
        setLoading(false);
      }
    };
    fetchResidents();
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="Residents Roll (Read Only)" subtitle="Oversight of active tenants across the platform" />
      <ContentContainer>
        {loading ? <div className="p-4 text-center text-slate-400">Loading residents...</div> : <SaaSTable headers={headers} data={data} />}
      </ContentContainer>
    </PageContainer>
  );
});

export default ResidentsList;
