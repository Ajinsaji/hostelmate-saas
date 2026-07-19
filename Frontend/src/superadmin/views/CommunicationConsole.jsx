import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";

export const CommunicationConsole = React.memo(() => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComms = async () => {
      try {
        const response = await api.get("/api/admin/communications");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching Comms data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComms();
  }, []);

  return (
    <PageContainer>
      <SectionHeader title="Communication Desk" subtitle="Broadcast system alerts, emails and WhatsApp notifications" />
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

export default CommunicationConsole;
