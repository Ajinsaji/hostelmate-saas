import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import StatCard from "../components/cards/StatCard";
import { api } from "../../services/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

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

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader title="Business Intelligence Analytics" subtitle="Occupancy ratios, owner engagement metrics and alert monitoring" />
        <ContentContainer>
          <div className="p-8 text-center text-slate-400">Loading Business BI data...</div>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer>
        <SectionHeader title="Business Intelligence Analytics" subtitle="Occupancy ratios, owner engagement metrics and alert monitoring" />
        <ContentContainer>
          <div className="p-8 text-center text-rose-300">Failed to load analytics data.</div>
        </ContentContainer>
      </PageContainer>
    );
  }

  // Format data for charts
  const revenueData = [
    { name: "Jan", Revenue: 0 },
    { name: "Feb", Revenue: 0 },
    { name: "Mar", Revenue: 0 },
    { name: "Apr", Revenue: 0 },
    { name: "May", Revenue: 0 },
    { name: "Jun", Revenue: data.totalRevenue || 0 } // Assuming current month is June/July for demo
  ];

  const distributionData = [
    { name: "Active Residents", value: data.totalResidents || 0 },
    { name: "Available Capacity", value: (data.totalHostels || 0) * 50 } // mock capacity formula
  ];
  const COLORS = ["#10b981", "#334155"];

  return (
    <PageContainer>
      <SectionHeader title="Business Intelligence Analytics" subtitle="Occupancy ratios, owner engagement metrics and alert monitoring" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total Hostels" value={data.totalHostels || 0} trend="Active" trendDirection="up" className="p-5" />
        <StatCard title="Total Residents" value={data.totalResidents || 0} trend="Growing" trendDirection="up" className="p-5" />
        <StatCard title="Total Revenue" value={`₹${data.totalRevenue?.toLocaleString() || 0}`} trend="Stable" trendDirection="up" className="p-5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentContainer>
          <h3 className="text-sm font-semibold text-white mb-4">Revenue Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                  itemStyle={{ color: "#38bdf8" }}
                />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ContentContainer>

        <ContentContainer>
          <h3 className="text-sm font-semibold text-white mb-4">Occupancy Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                  itemStyle={{ color: "#38bdf8" }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ContentContainer>
      </div>
    </PageContainer>
  );
});

export default AnalyticsDashboard;
