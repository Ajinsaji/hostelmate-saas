import { useTheme } from "../design-system/ThemeProvider";
import React, { useState, useEffect } from "react";
import {
  Building2,
  Layers,
  BedDouble,
  Plus,
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Edit,
  Grid,
  List,
  Shield,
  Activity,
  ArrowRight,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import VisualFloorPlan from "./VisualFloorPlan";
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


export const Rooms = () => {
  const { colors } = useTheme();
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activeTab, setActiveTab] = useState("rooms"); // rooms | buildings | floorplan | maintenance
  const [rooms, setRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [beds, setBeds] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);

  const [roomStats, setRoomStats] = useState(null);
  const [bedStats, setBedStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRoomType, setFilterRoomType] = useState("");

  // Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showAddBuildingModal, setShowAddBuildingModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Forms
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    buildingId: "",
    floorId: "",
    roomType: "Double",
    gender: "Male",
    capacity: 2,
    monthlyRent: 7500,
    securityDeposit: 5000,
    amenities: ["WiFi", "Study Table", "Cupboard"],
  });

  const [buildingForm, setBuildingForm] = useState({
    buildingName: "",
    buildingCode: "",
    description: "",
    address: "",
  });

  const [floorForm, setFloorForm] = useState({
    buildingId: "",
    floorName: "",
    floorNumber: 1,
    description: "",
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    targetType: "Room",
    targetId: "",
    reason: "",
    expectedCompletion: "",
    cost: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, bRes, fRes, bedRes, rStats, bStats, mRes] = await Promise.all([
        api.get("/api/rooms"),
        api.get("/api/buildings"),
        api.get("/api/floors"),
        api.get("/api/beds"),
        api.get("/api/rooms/statistics"),
        api.get("/api/beds/statistics"),
        api.get("/api/maintenance"),
      ]);

      if (rRes.data?.rooms) setRooms(rRes.data.rooms);
      if (bRes.data?.buildings) setBuildings(bRes.data.buildings);
      if (fRes.data?.floors) setFloors(fRes.data.floors);
      if (bedRes.data?.beds) setBeds(bedRes.data.beds);
      if (rStats.data?.success) setRoomStats(rStats.data);
      if (bStats.data?.success) setBedStats(bStats.data);
      if (mRes.data?.logs) setMaintenanceLogs(mRes.data.logs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load room management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/rooms", roomForm);
      toast.success("Room created with auto-generated beds!");
      setShowAddRoomModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room");
    }
  };

  const handleCreateBuilding = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/buildings", buildingForm);
      toast.success("Building created!");
      setShowAddBuildingModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create building");
    }
  };

  const handleCreateFloor = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/floors", floorForm);
      toast.success("Floor created!");
      setShowAddFloorModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create floor");
    }
  };

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/maintenance", maintenanceForm);
      toast.success("Maintenance logged!");
      setShowMaintenanceModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log maintenance");
    }
  };

  const handleCompleteMaintenance = async (logId) => {
    try {
      await api.patch(`/api/maintenance/${logId}/complete`);
      toast.success("Maintenance marked completed");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Completion failed");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.delete(`/api/rooms/${roomId}`);
      toast.success("Room soft deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchSearch = !search || r.roomNumber.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = !filterBuilding || r.buildingId?._id === filterBuilding || r.buildingId === filterBuilding;
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchType = !filterRoomType || r.roomType === filterRoomType;
    return matchSearch && matchBuilding && matchStatus && matchType;
  });

  return (
    
      <PageContainer>
          
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
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${!filterBuilding ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                All Buildings
              </button>
              {buildings.map(b => (
                <button 
                  key={b._id}
                  onClick={() => setFilterBuilding(b._id)}
                  className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${filterBuilding === b._id ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-700'}`}
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
                  className="w-full pl-11 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
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
              <KPICard title="Occupancy %" value={`${bedStats.occupancyRate || 0}%`} icon={Activity} color="rose" />
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
  {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Create New Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  placeholder="e.g. 101"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Building</label>
                <select
                  value={roomForm.buildingId}
                  onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">Select Building</option>
                  {buildings.map((b) => <option key={b._id} value={b._id} className="bg-slate-900">{b.buildingName}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Room Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={roomForm.monthlyRent}
                    onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddRoomModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      {showAddBuildingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Add Building</h3>
            <form onSubmit={handleCreateBuilding} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  value={buildingForm.buildingName}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })}
                  placeholder="e.g. Block A"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Building Code *</label>
                <input
                  type="text"
                  required
                  value={buildingForm.buildingCode}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingCode: e.target.value })}
                  placeholder="e.g. BLK-A"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddBuildingModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Building</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {showAddFloorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Add Floor</h3>
            <form onSubmit={handleCreateFloor} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Building *</label>
                <select
                  required
                  value={floorForm.buildingId}
                  onChange={(e) => setFloorForm({ ...floorForm, buildingId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Building --</option>
                  {buildings.map((b) => <option key={b._id} value={b._id} className="bg-slate-900">{b.buildingName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Floor Name *</label>
                <input
                  type="text"
                  required
                  value={floorForm.floorName}
                  onChange={(e) => setFloorForm({ ...floorForm, floorName: e.target.value })}
                  placeholder="e.g. Ground Floor"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Floor Number *</label>
                <input
                  type="number"
                  required
                  value={floorForm.floorNumber}
                  onChange={(e) => setFloorForm({ ...floorForm, floorNumber: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddFloorModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Floor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Log Maintenance</h3>
            <form onSubmit={handleCreateMaintenance} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Type</label>
                <select
                  value={maintenanceForm.targetType}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, targetType: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Room" className="bg-slate-900">Room</option>
                  <option value="Bed" className="bg-slate-900">Bed</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Maintenance Reason *</label>
                <input
                  type="text"
                  required
                  value={maintenanceForm.reason}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, reason: e.target.value })}
                  placeholder="e.g. AC Repair, Plumbing"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400">Log Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Rooms;
