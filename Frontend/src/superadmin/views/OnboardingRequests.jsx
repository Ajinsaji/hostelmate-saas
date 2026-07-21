import React from "react";
import { api } from "../../services/api";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import SearchBar from "../components/forms/SearchBar";
import FilterBar from "../components/forms/FilterBar";
import StatusBadge from "../components/feedback/StatusBadge";
import { CheckSquare } from "lucide-react";
import { COLORS } from "../constants/theme";

export const OnboardingRequests = React.memo(() => {
  const headers = [
    { key: "hostelName", label: "Hostel Name" },
    { key: "ownerName", label: "Owner Name" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "status", label: "Status" }
  ];

  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get('/api/admin/requests');
        const result = response.data;
        if (result.success) {
          setData(result.requests || []);
        } else {
          setError(result.message || 'Failed to fetch requests');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <PageContainer>
      <SectionHeader 
        title="Onboarding Requests"
        subtitle="Approve or reject incoming hostel signups"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder="Search requests..." onChange={() => {}} />
        <FilterBar 
          filters={[{ key: "status", label: "Status", options: [{ label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }] }]} 
          onFilterChange={() => {}}
        />
      </div>

      <ContentContainer>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading requests...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No Data</div>
        ) : (
          <SaaSTable 
            headers={headers} 
            data={data}
            renderRow={(row, idx) => (
              <tr key={row._id || idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition">
                <td className="px-6 py-4 text-xs font-bold text-white">{row.hostelName}</td>
                <td className="px-6 py-4 text-xs text-slate-300">{row.ownerName}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.phone}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{row.city}</td>
                <td className="px-6 py-4 text-xs">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            )}
          />
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default OnboardingRequests;
