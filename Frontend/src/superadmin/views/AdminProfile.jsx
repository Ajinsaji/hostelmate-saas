import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

export const AdminProfile = React.memo(() => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/admin/profile");
        if (response.data.success) {
          setData(response.data.admin);
        }
      } catch (error) {
        console.error("Error fetching Profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="Superadmin Profile" subtitle="Manage credentials and settings for this administrator account" />
      <ContentContainer>
        {loading ? (
          <p className="text-xs text-slate-400">Loading data...</p>
        ) : (
          <div className="text-slate-200">
            <pre className="text-sm p-4 bg-slate-900 rounded-lg max-h-96 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default AdminProfile;
