import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

export const PlatformSettings = React.memo(() => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/api/admin/settings");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching Settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="System Settings" subtitle="Configure subscription plans, billing rates, and security parameters" />
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

export default PlatformSettings;
