const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'owner', 'Rooms.jsx');
const content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('<div className="min-h-screen bg-[#081028]');
if (startIdx === -1) {
  console.error("Could not find start index");
  process.exit(1);
}

// Search for the end of the main div wrap. It ends right before the modals.
let endSearchIdx = content.indexOf('{showAddRoomModal &&');
if (endSearchIdx === -1) {
  console.log("Could not find showAddRoomModal");
  endSearchIdx = content.indexOf('{/* Maintenance Modal */}');
}

const replacement = `
    <OwnerLayout>
      <PageContainer>
        <Section className="py-4">
          
          {/* Top Search Area */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowAddBuildingModal(true)}>
                  <Building2 size={18} /> Add Building
                </Button>
                <Button variant="secondary" onClick={() => setShowAddFloorModal(true)}>
                  <Layers size={18} /> Add Floor
                </Button>
                <Button variant="primary" onClick={() => setShowAddRoomModal(true)}>
                  <Plus size={18} /> Add Room
                </Button>
              </div>
            </div>
            
            <AISearchBar 
              placeholder="Ask HostelMate AI (e.g., 'Show rooms nearing full occupancy')..."
              onSearch={(q) => console.log('AI Search:', q)} 
            />
            
            {/* Building Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
              <button 
                onClick={() => setFilterBuilding("")}
                className={\`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors \${!filterBuilding ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                All Buildings
              </button>
              {buildings.map(b => (
                <button 
                  key={b._id}
                  onClick={() => setFilterBuilding(b._id)}
                  className={\`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors \${filterBuilding === b._id ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  {b.buildingName}
                </button>
              ))}
            </div>

            {/* Floor & Status Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search room number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C4CF5]/20 focus:border-[#6C4CF5] transition-all shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto">
                <FilterChip label="All Status" isActive={!filterStatus} onClick={() => setFilterStatus("")} />
                <FilterChip label="Available" isActive={filterStatus === "Vacant"} onClick={() => setFilterStatus("Vacant")} />
                <FilterChip label="Partially Occupied" isActive={filterStatus === "Partially Occupied"} onClick={() => setFilterStatus("Partially Occupied")} />
                <FilterChip label="Full" isActive={filterStatus === "Fully Occupied"} onClick={() => setFilterStatus("Fully Occupied")} />
                <FilterChip label="Maintenance" isActive={filterStatus === "Under Maintenance"} onClick={() => setFilterStatus("Under Maintenance")} />
              </div>
            </div>
          </div>

          {/* Occupancy Dashboard */}
          {roomStats && bedStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <KPICard title="Total Rooms" value={roomStats.totalRooms || 0} icon={Layers} color="blue" />
              <KPICard title="Total Beds" value={bedStats.totalBeds || 0} icon={BedDouble} color="purple" />
              <KPICard title="Available Beds" value={bedStats.vacantBeds || 0} icon={CheckCircle2} color="emerald" />
              <KPICard title="Occupied Beds" value={bedStats.occupiedBeds || 0} icon={Shield} color="indigo" />
              <KPICard title="Maintenance" value={bedStats.maintenanceBeds || 0} icon={Wrench} color="amber" />
              <KPICard title="Occupancy %" value={\`\${bedStats.occupancyRate || 0}%\`} icon={Activity} color="rose" />
            </div>
          )}

          {/* Room Grid */}
          {loading ? (
            <CardGrid>
              {[1,2,3,4,5,6].map(i => <LoadingSkeleton key={i} type="card" />)}
            </CardGrid>
          ) : filteredRooms.length === 0 ? (
            <EmptyState 
              title="No Rooms Found"
              description="No rooms match your selected filters."
              icon={BedDouble}
              action={{ label: "Clear Filters", onClick: () => { setSearch(""); setFilterStatus(""); setFilterBuilding(""); } }}
            />
          ) : (
            <CardGrid>
              {filteredRooms.map(room => (
                <RoomCard 
                  key={room._id} 
                  room={room} 
                  onAction={(action, r) => {
                    if (action === 'view') {
                      setSelectedRoom(r);
                      setShowDrawer(true);
                    } else if (action === 'maintenance') {
                      setMaintenanceForm({ targetType: "Room", targetId: r._id, reason: "", cost: 0, expectedCompletion: "" });
                      setShowMaintenanceModal(true);
                    } else if (action === 'assign') {
                      toast.success('Assign Resident Modal coming soon');
                    }
                  }}
                  onClick={(r) => {
                     setSelectedRoom(r);
                     setShowDrawer(true);
                  }}
                />
              ))}
            </CardGrid>
          )}

        </Section>
      </PageContainer>
      
      {/* Drawer */}
      <RoomDetailsDrawer 
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        room={selectedRoom}
        beds={beds.filter(b => b.roomId?._id === selectedRoom?._id || b.roomId === selectedRoom?._id)}
        maintenanceLogs={maintenanceLogs.filter(m => m.targetId?._id === selectedRoom?._id || m.targetId === selectedRoom?._id)}
        onAction={(action, target) => {
           if (action === 'maintenance') {
              setMaintenanceForm({ targetType: "Room", targetId: selectedRoom._id, reason: "", cost: 0, expectedCompletion: "" });
              setShowMaintenanceModal(true);
           } else if (action === 'assign') {
              toast.success('Assign flow');
           }
        }}
      />
`;

let newContent = content.substring(0, startIdx) + replacement + content.substring(startIdx).substring(content.substring(startIdx).indexOf('{showAddRoomModal &&') - 2);

newContent = newContent.replace('</OwnerLayout>', '');
newContent = newContent.replace('export const Rooms = () => {', 'export const Rooms = () => {\n  const [showDrawer, setShowDrawer] = useState(false);\n  const [selectedRoom, setSelectedRoom] = useState(null);');
newContent = newContent.replace('export default Rooms;', '    </OwnerLayout>\n  );\n};\n\nexport default Rooms;');
// In case Rooms.jsx is not default exported: 
if (newContent.indexOf('export const Rooms') !== -1 && newContent.indexOf('export default Rooms;') === -1) {
  newContent = newContent.substring(0, newContent.lastIndexOf('}')); // remove the last }
  newContent += '    </OwnerLayout>\n  );\n};\n';
}

const newImports = `
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Section } from "../design-system/layouts/Section";
import { CardGrid } from "../design-system/layouts/CardGrid";
import { Button } from "../design-system/components/Button";
import FilterChip from "../design-system/components/FilterChip";
import { KPICard } from "../design-system/components/KPICard";
import RoomCard from "../design-system/components/RoomCard";
import RoomDetailsDrawer from "../design-system/components/RoomDetailsDrawer";
import { AISearchBar } from "../design-system/components/AISearchBar";
import { EmptyState } from "../design-system/components/EmptyState";
import { LoadingSkeleton } from "../design-system/components/LoadingSkeleton";
`;

const lastImportIndex = newContent.lastIndexOf('import');
const endOfLastImport = newContent.indexOf(';', lastImportIndex) + 1;
newContent = newContent.slice(0, endOfLastImport) + newImports + newContent.slice(endOfLastImport);

fs.writeFileSync(filePath, newContent);
console.log("Success");
