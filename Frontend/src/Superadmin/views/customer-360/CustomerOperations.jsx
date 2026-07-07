import React from "react";
import ContentContainer from "../../layouts/ContentContainer";
import SectionHeader from "../../layouts/SectionHeader";
import SectionCard from "../../components/cards/SectionCard";
import SaaSTable from "../../components/tables/SaaSTable";

export const CustomerOperations = React.memo(() => {
  const headers = [
    { key: "roomNumber", label: "Room" },
    { key: "roomType", label: "Type" },
    { key: "bedsCount", label: "Total Beds" },
    { key: "occupiedCount", label: "Occupants" },
    { key: "vacancy", label: "Vacancy Status" }
  ];

  const mockData = [
    { roomNumber: "101", roomType: "Double Sharing", bedsCount: 2, occupiedCount: 2, vacancy: "Full" },
    { roomNumber: "102", roomType: "Triple Sharing", bedsCount: 3, occupiedCount: 1, vacancy: "2 Vacancies" },
    { roomNumber: "201", roomType: "Single Premium", bedsCount: 1, occupiedCount: 0, vacancy: "1 Vacancy" },
    { roomNumber: "202", roomType: "Double Sharing", bedsCount: 2, occupiedCount: 1, vacancy: "1 Vacancy" }
  ];

  const staffHeaders = [
    { key: "name", label: "Staff Member" },
    { key: "role", label: "Role" },
    { key: "phone", label: "Phone" }
  ];

  const mockStaff = [
    { name: "Suresh P.", role: "Warden", phone: "+91 98765 43220" },
    { name: "Kamla Devi", role: "Cook Head", phone: "+91 98765 43221" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Beds Capacity</p>
          <p className="text-xl font-extrabold text-white mt-1">150 Beds</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupied Beds</p>
          <p className="text-xl font-extrabold text-white mt-1">128 Beds</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Beds Available</p>
          <p className="text-xl font-extrabold text-emerald-400 mt-1">22 Beds</p>
        </div>
      </div>

      <SectionCard title="Rooms Allocation Roll" subtitle="Real-time check on hostel rooms allocation status">
        <SaaSTable 
          headers={headers} 
          data={mockData}
          renderRow={(row, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
              <td className="px-6 py-4 text-white font-semibold">{row.roomNumber}</td>
              <td className="px-6 py-4 text-slate-300">{row.roomType}</td>
              <td className="px-6 py-4 text-slate-400">{row.bedsCount}</td>
              <td className="px-6 py-4 text-slate-400">{row.occupiedCount}</td>
              <td className="px-6 py-4">
                <span className={`font-bold ${row.vacancy === "Full" ? "text-rose-400" : "text-emerald-400"}`}>
                  {row.vacancy}
                </span>
              </td>
            </tr>
          )}
        />
      </SectionCard>

      <SectionCard title="Registered Staff" subtitle="Warden and cook profiles linked to this hostel">
        <SaaSTable 
          headers={staffHeaders} 
          data={mockStaff}
          renderRow={(row, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-b-0 text-xs">
              <td className="px-6 py-4 text-white font-semibold">{row.name}</td>
              <td className="px-6 py-4 text-slate-300">{row.role}</td>
              <td className="px-6 py-4 text-slate-400">{row.phone}</td>
            </tr>
          )}
        />
      </SectionCard>
    </div>
  );
});

export default CustomerOperations;
