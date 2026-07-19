import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

export const CustomerSuccess = React.memo(() => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCS = async () => {
      try {
        const response = await api.get("/api/admin/customer-success");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching CS data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCS();
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="Customer Success" subtitle="Track user feature adoption rates and customer feedback pipelines" />
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

export default CustomerSuccess;
