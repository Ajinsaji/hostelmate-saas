import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import { api } from "../../services/api";
import toast from "react-hot-toast";

export const OwnersList = React.memo(() => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const headers = [
    { key: "name", label: "Owner Name" },
    { key: "hostel", label: "Hostel" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" }
  ];

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const response = await api.get("/api/admin/owners");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching owners:", error);
        toast.error("Failed to fetch owners list");
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="Owners CRM" subtitle="Manage client owner profiles" />
      <ContentContainer>
        {loading ? <div className="p-4 text-center text-slate-400">Loading owners...</div> : <SaaSTable headers={headers} data={data} />}
      </ContentContainer>
    </PageContainer>
  );
});

export default OwnersList;
