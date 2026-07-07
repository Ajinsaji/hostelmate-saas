import React from "react";
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

  const mockData = [
    { id: 1, hostelName: "RMH Hostel #2", ownerName: "Rajesh Kumar", phone: "9876543210", city: "Bangalore", status: "pending" },
    { id: 2, hostelName: "Blue Hills Residency", ownerName: "Anita Sharma", phone: "9876543211", city: "Delhi", status: "pending" },
    { id: 3, hostelName: "Saraswati Niwas", ownerName: "Vijay Prasad", phone: "9876543212", city: "Pune", status: "approved" }
  ];

  return (
    <PageContainer>
      <SectionHeader 
        title="Onboarding Requests"
        subtitle="Approve or reject incoming hostel signups"
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchBar placeholder="Search requests..." onChange={(v) => console.log(v)} />
        <FilterBar 
          filters={[{ key: "status", label: "Status", options: [{ label: "Pending", value: "pending" }, { label: "Approved", value: "approved" }] }]} 
          onFilterChange={(k, v) => console.log(k, v)}
        />
      </div>

      <ContentContainer>
        <SaaSTable 
          headers={headers} 
          data={mockData}
          renderRow={(row, idx) => (
            <tr key={row.id || idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition">
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
      </ContentContainer>
    </PageContainer>
  );
});

export default OnboardingRequests;
