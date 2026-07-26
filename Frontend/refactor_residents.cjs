const fs = require('fs');
const path = require('path');

const residentsPath = path.join(__dirname, 'src', 'owner', 'Residents.jsx');
const content = fs.readFileSync(residentsPath, 'utf8');

const startIdx = content.indexOf('<div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">');
const endIdx = content.indexOf('{/* Add/Edit Resident Modal */}'); // or look for showAddModal

if (startIdx === -1) {
  console.error("Start index not found");
  process.exit(1);
}

// Search for the end of the main div wrap. It ends right before the modals.
// We can just find the first modal.
let endSearchIdx = content.indexOf('{showAddModal &&');
if (endSearchIdx === -1) {
  console.log("Could not find showAddModal");
  // maybe it's { showAddModal &&
  endSearchIdx = content.indexOf('showAddModal');
}

// find the closing div of the main container before the modals.
// Actually, it's easier to just replace from return ( to the end, but copy the modals.
// Let's use a regex or string extraction for modals.
const modalsMatch = content.substring(endSearchIdx - 50); // get everything from roughly where modals start to the end

const replacement = `
    <OwnerLayout>
      <PageContainer>
        <Section className="py-4">
          {/* Top Search Area */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Resident Management</h1>
              <Button 
                variant="primary" 
                onClick={() => {
                  setEditingResident(null);
                  setForm({
                    firstName: "",
                    lastName: "",
                    fullName: "",
                    phone: "",
                    email: "",
                    gender: "Male",
                    dateOfBirth: "",
                    aadhaarNumber: "",
                    guardianName: "",
                    guardianPhone: "",
                    emergencyContactName: "",
                    emergencyContactPhone: "",
                    occupation: "Student",
                    company: "",
                    college: "",
                    monthlyRent: 7500,
                    securityDeposit: 5000,
                    foodPreference: "Veg",
                    roomId: "",
                    bedId: "",
                    status: "Pending Admission",
                  });
                  setShowAddModal(true);
                }}
              >
                <Plus size={18} />
                Add Resident
              </Button>
            </div>
            
            <AISearchBar 
              placeholder="Ask HostelMate AI (e.g., 'Show residents with unpaid rent')..."
              onSearch={(q) => console.log('AI Search:', q)} 
            />
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, phone, room, or admission ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C4CF5]/20 focus:border-[#6C4CF5] transition-all shadow-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <FilterChip 
                label="All" 
                isActive={!filterStatus} 
                onClick={() => setFilterStatus("")} 
                count={totalCount}
              />
              <FilterChip 
                label="Active" 
                isActive={filterStatus === "Active"} 
                onClick={() => setFilterStatus("Active")} 
              />
              <FilterChip 
                label="Pending" 
                isActive={filterStatus === "Pending Admission"} 
                onClick={() => setFilterStatus("Pending Admission")} 
              />
              <FilterChip 
                label="Checked Out" 
                isActive={filterStatus === "Checked Out"} 
                onClick={() => setFilterStatus("Checked Out")} 
              />
              <FilterChip 
                label="Overdue" 
                isActive={filterStatus === "Overdue"} 
                onClick={() => setFilterStatus("Overdue")} 
              />
              <FilterChip 
                label="Blocked" 
                isActive={filterStatus === "Blocked"} 
                onClick={() => setFilterStatus("Blocked")} 
              />
            </div>
          </div>

          {/* KPI Summary */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KPICard 
                title="Total Residents"
                value={stats.totalResidents || 0}
                icon={Users}
                color="blue"
              />
              <KPICard 
                title="Occupied Beds"
                value={stats.occupiedBeds || 0}
                icon={BedDouble}
                color="emerald"
              />
              <KPICard 
                title="Vacant Beds"
                value={stats.vacantBeds || 0}
                icon={CheckCircle}
                color="amber"
              />
              <KPICard 
                title="Pending Rent"
                value={\`₹\${stats.totalPendingRent || 0}\`}
                icon={CreditCard}
                color="rose"
              />
            </div>
          )}

          {/* Resident Grid */}
          {loading ? (
            <CardGrid>
              {[1,2,3,4,5,6].map(i => <LoadingSkeleton key={i} type="card" />)}
            </CardGrid>
          ) : residents.length === 0 ? (
            <EmptyState 
              title="No Residents Found"
              description="Try adjusting your search or filters, or add a new resident."
              icon={Users}
              action={{
                label: "Clear Filters",
                onClick: () => { setSearch(""); setFilterStatus(""); }
              }}
            />
          ) : (
            <>
              <CardGrid>
                {residents.map(resident => (
                  <ResidentCard 
                    key={resident._id} 
                    resident={resident}
                    onAction={(action, res) => {
                      setSelectedResident(res);
                      if (action === 'view') {
                        handleViewProfile(res);
                      } else if (action === 'edit') {
                        setEditingResident(res);
                        setForm({ ...res });
                        setShowAddModal(true);
                      } else if (action === 'collect_rent') {
                         // Collect rent modal or route
                      } else if (action === 'more') {
                         setShowTransferModal(true);
                      }
                    }}
                  />
                ))}
              </CardGrid>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-sm text-gray-500">
                    Showing page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Section>
      </PageContainer>
`;

let newContent = content.substring(0, startIdx) + replacement + content.substring(startIdx).substring(content.substring(startIdx).indexOf('{showAddModal &&') - 2);

newContent = newContent.replace('</OwnerLayout>', '');
newContent = newContent.replace('export default Residents;', '    </OwnerLayout>\n  );\n};\n\nexport default Residents;');

const newImports = `
import OwnerLayout from "../design-system/layouts/OwnerLayout";
import PageContainer from "../design-system/layouts/PageContainer";
import Section from "../design-system/layouts/Section";
import CardGrid from "../design-system/layouts/CardGrid";
import Button from "../design-system/components/Button";
import FilterChip from "../design-system/components/FilterChip";
import KPICard from "../design-system/components/KPICard";
import ResidentCard from "../design-system/components/ResidentCard";
import AISearchBar from "../design-system/components/AISearchBar";
import EmptyState from "../design-system/components/EmptyState";
import LoadingSkeleton from "../design-system/components/LoadingSkeleton";
`;
const lastImportIndex = newContent.lastIndexOf('import');
const endOfLastImport = newContent.indexOf(';', lastImportIndex) + 1;
newContent = newContent.slice(0, endOfLastImport) + newImports + newContent.slice(endOfLastImport);

fs.writeFileSync(residentsPath, newContent);
console.log("Success");
