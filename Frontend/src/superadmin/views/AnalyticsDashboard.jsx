import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

export const AnalyticsDashboard = React.memo(() => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBI = async () => {
      try {
        const response = await api.get("/api/admin/business-bi");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching BI data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBI();
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="Business Intelligence Analytics" subtitle="Occupancy ratios, owner engagement metrics and alert monitoring" />
      <ContentContainer>
        {loading ? (
          <p className="text-xs text-slate-400">Loading data...</p>
        ) : (
          <div className="text-slate-200">
            <pre className="text-sm p-4 bg-slate-900 rounded-lg">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default AnalyticsDashboard;
